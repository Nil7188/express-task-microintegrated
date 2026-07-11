const db = require("../config/db");

exports.createOrder = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { user, order } = req.body;

    // Mandatory Validation
    if (
      !user ||
      !user.full_name ||
      !user.email ||
      !user.mobile ||
      !order ||
      !order.order_date ||
      !order.items ||
      order.items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are mandatory"
      });
    }

    // Existing User Check
    const [existingUser] = await connection.query(
      "SELECT * FROM users WHERE email=? OR mobile=?",
      [user.email, user.mobile]
    );

    let userId;

    if (existingUser.length > 0) {
      userId = existingUser[0].user_id;
    } else {
      const [newUser] = await connection.query(
        `INSERT INTO users(full_name,email,mobile,status)
         VALUES(?,?,?,?)`,
        [
          user.full_name,
          user.email,
          user.mobile,
          "Active"
        ]
      );

      userId = newUser.insertId;
    }

    // Duplicate Product Validation
    const products = new Set();

    for (const item of order.items) {

      if (products.has(item.product_name.toLowerCase())) {

        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "Duplicate products are not allowed."
        });

      }

      products.add(item.product_name.toLowerCase());
    }

    // Calculate Total
    let totalAmount = 0;

    order.items.forEach(item => {
      totalAmount += item.quantity * item.price;
    });

    // Insert Order
    const [newOrder] = await connection.query(
      `INSERT INTO orders(user_id,order_date,total_amount)
       VALUES(?,?,?)`,
      [
        userId,
        order.order_date,
        totalAmount
      ]
    );

    const orderId = newOrder.insertId;

    // Insert Order Items
    for (const item of order.items) {

      await connection.query(
        `INSERT INTO order_items
        (order_id,product_name,quantity,price)
        VALUES(?,?,?,?)`,
        [
          orderId,
          item.product_name,
          item.quantity,
          item.price
        ]
      );

    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Order Created Successfully",
      order_id: orderId,
      total_amount: totalAmount,
      total_items: order.items.length
    });

  } catch (error) {

    await connection.rollback();

    res.status(500).json({
      success: false,
      message: error.message
    });

  } finally {

    connection.release();

  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT
        u.user_id,
        u.full_name,
        u.email,
        u.mobile,
        u.status,
        o.order_id,
        o.order_date,
        o.total_amount,
        oi.item_id,
        oi.product_name,
        oi.quantity,
        oi.price
      FROM orders o
      INNER JOIN users u
      ON o.user_id = u.user_id
      INNER JOIN order_items oi
      ON o.order_id = oi.order_id
      WHERE o.order_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const response = {
      user: {
        user_id: rows[0].user_id,
        full_name: rows[0].full_name,
        email: rows[0].email,
        mobile: rows[0].mobile,
        status: rows[0].status
      },

      order: {
        order_id: rows[0].order_id,
        order_date: rows[0].order_date,
        total_amount: rows[0].total_amount
      },

      items: []
    };

    rows.forEach((item) => {
      response.items.push({
        item_id: item.item_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price
      });
    });

    res.status(200).json(response);

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
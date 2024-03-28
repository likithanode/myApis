const Cities = require("../../models/cities");
const ADMIN = require("../../models/user");
const ATM = require("../../models/atmdevice");
const TRANSACTION = require("../../models/transaction");
const jwt = require("jsonwebtoken");
const sensorAlert = require("../../models/sensoralert");
const stockalerts = require("../../models/stockalerts");

//  All Cities

exports.cities = async (req, res) => {
  try {
    const { city } = req.body;

    if (!city) {
      return res.status(404).json({ message: "cities are required." });
    }
    const cities = await Cities.create({
      city: city,
    });
    res.status(200).json({ message: "City added successfully", cities });
  } catch (error) {
    console.log(error.message);
  }
};

// Get All City

exports.getAllcity = async (req, res) => {
  try {
    const cities = await Cities.find();

    if (!cities || cities.length === 0) {
      return res.status(400).json({ message: "No cities found" });
    } else {
      return res.status(200).json({ cities });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GetAtmCount

exports.getAtmCount = async (req, res) => {
  try {
    const adminid = req.AuthId;
    const admin = await ADMIN.findOne({ user_id: adminid });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found!" });
    }
    const atms = await ATM.find({ user_id: adminid });
    if (atms.length === 0) {
      return res.status(200).json({ AtmCount: 0 });
    }

    const AtmCount = atms.length;
    return res.status(200).json({ AtmCount });
  } catch (error) {
    console.log(error.message);
  }
};

// GetAllTransaction

exports.getTransactionAtmCount = async (req, res) => {
  try {
    const adminid = req.AuthId;
    const admin = await ADMIN.findOne({ user_id: adminid });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found!" });
    }
    const atms = await ATM.find({ user_id: adminid });

    if (atms.length === 0) {
      return res.status(200).json({ atmsCount: 0, TransactionsCount: 0 });
    }
    const atmsCount = atms.length;
    const atmIds = atms.map((atm) => atm.atmid);
    const transactions = await TRANSACTION.find({ atmid: { $in: atmIds } });

    if (transactions.length === 0) {
      return res.status(200).json({ TransactionsCount: 0, atmsCount });
    }

    const TransactionsCount = transactions.length;
    return res.status(200).json({ TransactionsCount, atmsCount });
  } catch (error) {
    console.log(error.message);
  }
};

// GetAdminDetails

exports.getAdminDetails = async (req, res) => {
  try {
    const adminid = req.AuthId;
    console.log(adminid, "adminid");

    const admin = await ADMIN.findOne({ user_id: adminid });
    console.log(admin);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found!" });
    }
    return res.status(200).json({ admin });
  } catch (error) {
    console.log(error.message);
  }
};

// GetAtmDetails

exports.getAtmDetails = async (req, res) => {
  try {
    const adminid = req.AuthId;
    const admin = await ADMIN.findOne({ user_id: adminid });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found!" });
    }
    const atms = await ATM.find({ user_id: adminid });
    if (!atms) {
      return res.status(404).json({ message: "ATM not found for the admin!" });
    }
    return res.status(200).json({ atms });
  } catch (error) {
    console.log(error.message);
  }
};

exports.adminRegister = async (req, res) => {
  try {
    if (!req.body.name)
      return res.status(400).send({ message: "please enter name" });
    if (!req.body.phone)
      return res.status(400).send({ message: "please enter phone" });
    if (!req.body.email)
      return res.status(400).send({ message: "please enter email" });
    if (!req.body.password)
      return res.status(400).send({ message: "please enter password" });
    if (!req.body.status)
      return res.status(400).send({ message: "please enter status" });

    const olduser = await ADMIN.findOne({ email: req.body.email });
    if (olduser) {
      return res.status(400).json({ mes: "User Email Already Exist. Please Login" });
    }
    const number = await ADMIN.findOne({ phone: req.body.phone });
    if (number) {
      return res.status(400) .json({ mes: "User Mobile Already Exist. Please Login" });
    }
    const admin = await ADMIN({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      role: 2,
      status: req.body.status,
    });
    //console.log(admin)
    const token = jwt.sign({ admin: admin }, process.env.JWT_TOKEN_SECRET);
    admin.save();
    response.admin = admin;
    response.token = token;
    return res.status(200).json(response);
  } catch (error) {
    console.log(error.message);
  }
};

exports.getCityTransactions = async (req, res) => {
  try {
    const adminId = req.AuthId;
    const { adminid } = req.params;

    const admin = await ADMIN.findOne({ user_id: adminId });
    console.log(admin);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    const admincity = await ADMIN.findOne({ user_id: adminid });
    if (!admincity) {
      return res.status(404).json({ message: "city not found" });
    }
    if (admin.role === 1) {
      const atms = await ATM.find({ user_id: adminid });
      const atmIds = atms.map((atm) => atm.atmid);
      const transaction = await TRANSACTION.find({ atmid: { $in: atmIds } });
      return res.status(200).json({ transaction });
    } else if (admin.role === 2) {
      const atms = await ATM.find({ user_id: adminId });
      const atmId = atms.map((atm) => atm.atmid);
      const transaction = await TRANSACTION.find({ atmid: { $in: atmId } });
      return res.status(200).json({ transaction });
    } else {
      return res.status(400).json({ message: "Something went wrong" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

exports.sensorAlert = async (req, res) => {
  try {
    const { atmid, event_type } = req.body;
    if (!atmid) return res.status(404).json({ message: "please enter atmid" });
    if (!event_type)
      return res.status(404).json({ message: "please enter event_type" });
    const atms = await ATM.findOne({ atmid: atmid });
    const superAdmin = await ADMIN.findOne({ user_id: atms.user_id, role: 1 });
    if (superAdmin) {
      const alert = await sensorAlert.create({
        user_Id: superAdmin.user_id,
        atmcity: atms.atmCity,
        atmid: atmid,
        atmlocation: atms.atmlocation,
        event_type: req.body.event_type,
        message: `Our ATM located at ${atms.atmlocation} has detected ${event_type}. Please proceed to inspect the ATM promptly.`,
      });
      console.log(alert, "alert");
      return res.status(200).json({ message: "Alert created" });
    } else {
      const normalAdmin = await ADMIN.findOne({user_id: atms.user_id,role: 2});
      const superAdminData = await ADMIN.findOne({ role: 1 });
      console.log(superAdminData);
      if (normalAdmin) {
        console.log(atms.atmCity, atms, "normal admin");
        const alert = await sensorAlert.create({
          user_Id: normalAdmin.user_id,
          atmCity: atms.atmCity,
          atmid: atmid,
          atmlocation: atms.atmlocation,
          event_type: event_type,
          message: `Our ATM located at ${atms.atmlocation} has detected ${event_type}. Please proceed to inspect the ATM promptly.`,
        });
        console.log(alert);
        const superAlert = await sensorAlert.create({
          user_Id: superAdmin.user_id,
          atmCity: atms.atmCity,
          atmid: atmid,
          atmlocation: atms.atmlocation,
          event_type: event_type,
          message: `Our ATM located at ${atms.atmlocation} has detected ${event_type}. Please proceed to inspect the ATM promptly.`,
        });
        console.log(superAlert, "super");
        return res.status(200).json({ message: "alert created" });
      } else {
        return res.status(404).json({ message: "Something went wrong" });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

exports.getSensorAlerts = async (req, res) => {
  try {
    const adminid = req.AuthId;
    const admin = await ADMIN.findOne({ user_id: adminid });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    if (admin.role === 1) {
      const alert = await sensorAlert.find().sort({ createdAt: -1 });

      if (!alert) {
        return res.status(404).json({ message: "sensor alerts not found!" });
      }
      return res.status(200).json(alert);
    } else if (admin.role === 2) {
      const alert = await sensorAlert.find({ user_id: adminid }).sort({ createdAt: -1 });
      if (!alert) {
        return res.status(404).json({ message: "sensor alerts not found!" });
      }
      return res.status(200).json(alert);
    } else {
      return res.status(400).json({ message: "Something went wrong" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

exports.getStockAlerts = async (req, res) => {
  try {
    const adminid = req.AuthId;
     const admin = await ADMIN.findOne({ user_id: adminid });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    if (admin.role ===1) {
      const alert = await stockalerts.find().sort({ createdAt: -1 });
     
      if (!alert) {
        return res.status(404).json({ message: "stock alert not found" });
      }
      return res.status(200).json(alert);
    } else if (admin.role ===2) {
      const alert = await stockalerts.find({ user_id: adminid }).sort({ createdAt: -1 });
   
      if (!alert) {
        return res.status(404).json({ message: "alert not found" });
      }
      return res.status(200).json(alert);
    } else {
      return res.status(400).json({ message: "Something went wrong" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

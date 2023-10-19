const nodemailer = require("nodemailer");

const mailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: "eandbpos@gmail.com",
    pass: "evwc qbsm wvhp gnze",
  },
});

module.exports = {
  mailTransporter,
};

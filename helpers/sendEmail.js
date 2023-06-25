const nodemailer = require("nodemailer");
require("dotenv").config();

const { META_EMAIL, META_PASSWORD } = process.env;

const config = {
  host: "smtp.meta.ua",
  port: 465,
  secure: true,
  auth: {
    user: META_EMAIL,
    pass: META_PASSWORD,
  },
};

const transporter = nodemailer.createTransport(config);

/* const emailOptions = {
  from: META_EMAIL,
  to: "noresponse@gmail.com",
  subject: "Nodemailer test",
  text: "Привіт. Ми тестуємо надсилання листів!",
};

transporter
  .sendMail(emailOptions)
  .then((info) => console.log(info))
  .catch((err) => console.log(err)); */

const sendEmail = async (data) => {
  const email = { ...data, from: META_EMAIL };
  await transporter.sendMail(email);
  return true;
};

module.exports = sendEmail;

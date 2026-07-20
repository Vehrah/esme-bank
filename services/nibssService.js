const axios = require("axios");

exports.validateBVN = async (bvn) => {
  try {
    const response = await axios.post(
      `${process.env.NIBSS_BASE_URL}/api/validateBvn`,
      { bvn }
    );

    console.log("Phoenix Response:", response.data);

    return response.data;
  } catch (error) {
    console.log("Status Code:", error.response?.status);
    console.log("Data:", error.response?.data);
    console.log("Message:", error.message);

    throw error;
  }
};

exports.createAccount = async ({ kycType, kycID, dob }, token) => {
  try {
    const response = await axios.post(
      `${process.env.NIBSS_BASE_URL}/api/account/create`,
      { kycType, kycID, dob },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.account;
  } catch (error) {
    console.log(error.response?.data || error.message);
    throw new Error("Account creation failed");
  }
};

exports.generateToken = async ({ apiKey, apiSecret }) => {
  try {
    const response = await axios.post(
      `${process.env.NIBSS_BASE_URL}/api/auth/token`,
      { apiKey, apiSecret }
    );

    return response.data.token;
  } catch (error) {
    console.log(error.response?.data || error.message);
    throw new Error("Token generation failed");
  }
};

exports.nameEnquiry = async (accountNumber, token) => {
  try {
    const response = await axios.get(
      `${process.env.NIBSS_BASE_URL}/api/account/name-enquiry/${accountNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.log(error.response?.data || error.message);
    throw new Error("Name enquiry failed");
  }
};

exports.nibssTransfer = async ({ from, to, amount }, token) => {
  try {
    const response = await axios.post(
      `${process.env.NIBSS_BASE_URL}/api/transfer`,
      { from, to, amount },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.log(error.response?.data || error.message);
    throw new Error("Transfer failed");
  }
};

exports.checkBalance = async (accountNumber, token) => {
  try {
    const response = await axios.get(
      `${process.env.NIBSS_BASE_URL}/api/account/balance/${accountNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.log(error.response?.data || error.message);
    throw new Error("Check balance failed");
  }
};

exports.checkTransactionStatus = async (ref, token) => {
  try {
    const response = await axios.get(
      `${process.env.NIBSS_BASE_URL}/api/transaction/${ref}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.log(error.response?.data || error.message);
    throw new Error("Check transaction status failed");
  }
  
};
const axios= require("axios");

exports.validateBVN = async (bvn) => {
  try {
    const response = await axios.post(
      `${process.env.NIBSS_BASE_URL}/api/validateBvn`,
      { bvn }
    );

    return response.data;
  } catch (error) {
    console.log(error.response?.data || error.message);
    throw new Error("BVN validation failed");
  }
};


exports.createAccount = async ({ kycType, kycID, dob }, token) => {
  try {
    const config = {
        headers: {
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json'  
        }
    };

    const response = await axios.post(
      `${process.env.NIBSS_BASE_URL}/api/account/create`,
      { kycType, kycID, dob }, config
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
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    };

    const response = await axios.get(
      `${process.env.NIBSS_BASE_URL}/api/account/name-enquiry/${accountNumber}`,
      config
    );

    return response.data;
  } catch (error) {
    console.log(error.response?.data || error.message);
    throw new Error("Name enquiry failed");
  }
};

exports.nibssTransfer = async ({ from, to, amount }, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    };

    const response = await axios.post(
      `${process.env.NIBSS_BASE_URL}/api/transfer`,
      { from, to, amount },
      config
    );

    return response.data;
  } catch (error) {
    console.log(error.response?.data || error.message);
    throw new Error("Transfer failed");
  }
};

exports.checkBalance = async (accountNumber, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    };

    const response = await axios.get(
      `${process.env.NIBSS_BASE_URL}/api/account/balance/${accountNumber}`,
      config
    );


    return response.data;
  } catch (error) {
    console.log(error.response?.data || error.message);
    throw new Error("check balance failed");
  }
};


exports.checkTransactionStatus = async (ref, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    };

    const response = await axios.get(
      `${process.env.NIBSS_BASE_URL}/api/transaction/${ref}`,
      config
    );

    return response.data;
  } catch (error) {
    console.log(error.response?.data || error.message);
    throw new Error("check transaction status failed");
  }
};

const bcrypt = require("bcrypt");

const hash = "$2b$10$ei/sC96eMM0hJkojE6EZ7uFvBVC1qJhUTI2o3/Sp/d86gAzqshdYS";

(async () => {
  console.log("123456789:", await bcrypt.compare("123456789", hash));
  console.log("23456789:", await bcrypt.compare("23456789", hash));
})();
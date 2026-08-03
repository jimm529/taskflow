const dns = require("dns");

dns.resolveSrv(
  "_mongodb._tcp.taskflowcluster.ghl3h1i.mongodb.net",
  (err, addresses) => {
    if (err) {
      console.error("DNS Error:", err);
    } else {
      console.log(addresses);
    }
  }
);
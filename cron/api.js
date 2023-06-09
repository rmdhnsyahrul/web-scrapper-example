const { scrapePendaftar } = require("../src/pendaftar.js");

const handler = async (req, res) => {
  try {
    await scrapePendaftar({ url, sekolahID, type });
    res.status(200).json({ message: "Success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default handler;

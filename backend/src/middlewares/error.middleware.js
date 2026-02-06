exports.notFound = (req, res) => {
  res.status(404).json({ message: "Not Found" });
};

exports.errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
};

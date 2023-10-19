const transformToCSVFormat = (data, remove = []) => {
  let array = data;
  if (remove.length) {
    remove.forEach((propToRemove) => {
      array = data.map((obj) => {
        const newObj = obj;
        delete newObj[propToRemove];
        return newObj;
      });
    });
  }

  const header = Object.keys(array[0]); // Extract keys from the first object

  const csvData = [header]; // Initialize with header as the first row

  // Iterate over the data and extract values for each key
  for (const obj of array) {
    const values = header.map((key) => obj[key]);
    csvData.push(values);
  }

  return csvData.map((row) => row.join(",")).join("\n");
};

module.exports = {
  transformToCSVFormat,
};

const CreateJSON = (data) => {
  const keyValuePairs = [];
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }

    keyValuePairs.push(obj);
  }

  return keyValuePairs;
}

module.exports = CreateJSON;
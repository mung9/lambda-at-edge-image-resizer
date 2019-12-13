const AWS = require('aws-sdk');
const sharp = require('sharp');

const s3 = new AWS.S3({ apiVersion: '2006-03-01', region: "us-east-1" });
const bucket = "travel-together2";

exports.handler = async (event, context, callback) => {
  const response = event.Records[0].cf.response;

  var params = {
    Bucket: bucket,
    Key: "loop.png"
  };

  try {
    const obj = await s3.getObject(params).promise();
    const buffer = await sharp(obj.Body).resize(150).toBuffer();
    response.body = buffer.toString('base64');
  } catch (err) {
    console.log(err);
    return err;
  }

  response.status = 200;
  response.statusDescription = 'OK';
  response.headers['content-type'] = [{ key: 'Content-Type', value: 'image/png' }];
  response.bodyEncoding = 'base64';

  return response;
};
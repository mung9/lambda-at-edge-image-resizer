const AWS = require('aws-sdk');
const sharp = require('sharp');
const querystring = require('querystring');

const s3 = new AWS.S3({ apiVersion: '2006-03-01', region: "us-east-1" });
const bucket = "travel-together2";

const allowedFormats = ["jpeg", "jpg", "webp", "gif", "png", "tiff"];

exports.handler = async (event, context, callback) => {
  const response = event.Records[0].cf.response;
  const request = event.Records[0].cf.request;

  if (response.status !== "200") {
    return response;
  }

  const params = {
    Bucket: bucket,
    Key: decodeURIComponent(request.uri).substring(1)
  };

  const resizingOptions = resolveResizingOptions(event);

  try {
    const obj = await s3.getObject(params).promise();
    response.body = (await sharp(obj.Body).resize(resizingOptions).toBuffer()).toString('base64');
  } catch (err) {
    console.log(err);
    return err;
  }

  response.status = 200;
  response.statusDescription = 'OK';
  response.headers['content-type'] = [{ key: 'Content-Type', value: `image/${resizingOptions.requiredFormat}` }];
  response.bodyEncoding = 'base64';

  return response;
};

function resolveResizingOptions(event) {
  const request = event.Records[0].cf.request;
  const uri = request.uri;
  const qs = request.querystring;

  const originalFormat = uri.substring(uri.lastIndexOf(".") + 1);

  const parsedQuery = querystring.parse(qs);

  if (parsedQuery.w < 1) delete parsedQuery.w;
  if (parsedQuery.h < 1) delete parsedQuery.h;
  const requiredFormat = resolveRequiredFormat(parsedQuery.f) || originalFormat;

  return {
    width: isNaN(+parsedQuery.w) ? undefined : +parsedQuery.w,
    height: isNaN(+parsedQuery.h) ? undefined : +parsedQuery.h,
    originalFormat,
    requiredFormat
  }
}

function resolveRequiredFormat(f) {
  if (!f) return undefined;

  f = f.toLowerCase();

  if (f === "jpg") {
    f = "jpeg";
  }

  if (allowedFormats.includes(f)) {
    return f;
  }

  return undefined;
}
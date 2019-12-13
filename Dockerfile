FROM lambci/lambda:build-nodejs10.x

ENV AWS_DEFAULT_REGION us-east-1

COPY . .

RUN npm install

RUN zip -9yr image-resizer.zip .

CMD aws lambda update-function-code --function-name imageResizer --zip-file fileb://image-resizer.zip
FROM node:22-alpine

#Create a app directory
WORKDIR /usr/src/app

#Install app dependencies
COPY package*.json ./

#RUN npm install
RUN npm install

#Bundle app souce
COPY . .

EXPOSE 8080

CMD [ "npm", "run", "dev" ]

# for make build
# docker build . -t (name of the image we want to create)

# for run the docker
# docker run -p 8080:8080 -d (name of the image we created)

# create docker tag
# docker tag (name of the image we created) khushalsaboo108/telco-be:(verson : 1.0.1)

# docker push
# docker push khushalsaboo108/telco-be:(verson: 1.0.1)


# Getting base image ubuntu
FROM ubuntu

LABEL Author="Bhupender Pareek <bhupender.pareek@ranosys.com>"

ARG USER_ID
ARG GROUP_ID

# Expose the port 3000
EXPOSE 3000

RUN apt-get update && apt install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs git
RUN npm install -g sgmf-scripts
RUN addgroup --gid $GROUP_ID user
RUN adduser --disabled-password --gecos '' --uid $USER_ID --gid $GROUP_ID user
RUN mkdir -p /home/bath-and-body-works


WORKDIR "/home/bath-and-body-works"

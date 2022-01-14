<p align="center">
  <img src="https://github.com/zzzteph/appsec.study/blob/main/dev/logo.png?raw=true"  height="350">
</p>

# AppsecStudy


AppsecStudy is an open-source eLearning management system for information security. 

Because preventing vulnerability is less costly than redeveloping the complete application, infosec education and training become more and more actual. As a result, developers can greatly reduce the risk and expense from cyber attacks in the future by creating secure code. In addition, training the team based on the security assessment results to correct actual errors provides ongoing protection for existing and future products.

Since studying is impossible without a practical part, providing hands-on lab training for developing teams is a necessary step.
AppsecStudy - an open-source platform for seminars, training, and organizing courses for practical information security for developers and IT specialists. This tool has all the built-in basic requirements needed for organizing normal and productive training.


### Repository structure

**server** - platform itself, under development 

**dev** - different docs and temporary files need for development.

**trysec** - ready to use demo.



# Demo

Demo: https://appsec.study

Youtube: https://www.youtube.com/watch?v=xVg4fdb1nOc


# Setup

Here you can find a manual on how to setup your own server, build an agent from the source and run it. You always can download a Release that is already built and run it.

## Server

Server is written on Laravel and provides a web interface for creating brute force tasks and also serves for managing agents. 

### Setup

```
sudo apt update
sudo apt-get -y install unzip git
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/1.25.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo systemctl enable docker

git clone https://github.com/zzzteph/appsec.study
cd appsec.study/trysec
sudo docker-compose build app
sudo docker-compose up -d
sudo docker-compose exec app composer install
sudo docker-compose exec app php artisan key:generate
sudo docker-compose exec app php artisan migrate
sudo docker-compose exec app php artisan storage:link
```

#### Additional setup


#### Configure OAUTH

In ```.env``` file you can modify your Google OAUTH credentials.
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```



#### Configure Google Cloud Platform




#### Configure roles
There is no default creadentials in the system, so you can make user **Administrator** with next command:

```
sudo docker-compose exec app php artisan make:admin {user_id}
```

Example, suppose you have only one newly registered user
```
sudo docker-compose exec app php artisan make:admin 1
```




**The platform is under development, and this section will be supplemented as new information becomes available.**




# Contacts

- [@_w34kp455](https://twitter.com/w34kp455)

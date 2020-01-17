# Mongo Database

We need a way to store information that the app either needs or collects.  For example, we need to know
information about a user that signs up, and what permissions he or she has.  We also want a way to 
persist information about messages we receive so that we can operate on them later if needed.

In this chapter, we will go over setting up a mongodb database, and in later chapters we will revisit
it to shore up security and create some new indexes to speed up searches.  This chapter will also
go over a docker set up to make it easier to set up our static backend files, and setup up the necessary
networking glue to get our rust actix server and databse to talk to each other

## TODO: Setting up dockerfile and docker-compose

## TODO: setup schemas for our initial data types

## TODO: setup initial db.rs code 
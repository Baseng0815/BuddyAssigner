# BuddyAssigner server

This project represents the server part of our application. It takes requests,
updates the database, assigns buddies and sends mail. For that it provides the
following endpoints.

- `/get/users` (requires admin pass)
    - input: query parameters
    - output: status with a list of users (can be empty)
- `/delete/user/:email` (requires admin pass)
    - input: the mail address of the account to be deleted
    - output: status
- `/post/user` (requires admin pass on update and admin or user pass on creation)
    - input: a user to update based on mail or to create
        - a creation will occur if the mail doesn't exist yet
        - on update, fields can be omitted
        - on create, every field needs to be present (except buddies)
    - output: status

A status is defined as follows
```
status = {
    ok: 'true' OR 'false',
    message: 'successfully added...' OR 'failed to do x: error message',
    data: OPTIONAL
}
```

Every time a user is created, the `registerMail` is sent. Every time a user is
created or updated, the server tries to find a matching buddy to assign to. If
a buddy is found, the `bigBuddyAssignedMail` will be sent to the small buddy and
the `smallBuddyAssignedMail` to the big buddy.

The server will receive the admin and user pass from the authorization header in
base64 and then simply compare them to the stored plaintext passwords contained
in `.env`. *Be careful to not accidentally push this file or other will have
access to your passwords.*

Parameters need to be checked thoroughly to avoid crashes and invalid database
writes. This is a matter that will become only more obvious once the server is
deployed for real and receives more than a few test requests.

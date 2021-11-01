# BuddyAssigner client

This project is a single-page web frontend which uses [React.js](https://reactjs.org/).
The styling is rather minimal as I'm not a web developer by heart, so you'll have
to live with it. It looks way better in my opinion anyway.

React is a PITA to work with, so you might find the code ugly to read. The API
fetch code also seems pretty broken, although it works. One more reason to take
extra care making the API robust and not take any invalid requests.

There are two main pages - a register page and an admin page. The register page
is used by people registering themselves and the admin page contains various
controls as well as a user list and a way to edit users. Both are protected by
different passwords. While edits are possible through the web interface, it is
advised to directly edit the database via any graphical editor of your choice.

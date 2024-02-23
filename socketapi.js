const usermodel = require("./routes/users");
const msgmodel = require("./routes/msg");
const groupmodel = require("./routes/group");
const io = require("socket.io")();
const socketapi = {
  io: io,
};

io.on("connection", function (socket) {
  console.log("A user connected");

  socket.on("create-new-group", async (groupDetails) => {
    const newGroup = await groupmodel.create({
      name: groupDetails.groupName,
    });

    const currentUser = await usermodel.findOne({
      username: groupDetails.sender,
    });

    newGroup.users.push(currentUser._id);
    await newGroup.save();
    socket.emit("group-created", newGroup);
  });

  socket.on("join-room", async (username) => {
    const currentuser = await usermodel.findOne({ username: username });

    const onlineusers = await usermodel.find({
      socketId: { $nin: [""] },
      username: { $nin: [currentuser.username] },
    });
    // console.log(onlineusers);
    onlineusers.forEach((onlineuser) => {
      socket.emit("newuserjoined", {
        img: onlineuser.img,
        username: onlineuser.username,
        lastmessage: "hello!",
      });
    });

    const allGroups = await groupmodel.find({
      users: {
        $in: [currentuser._id],
      },
    });

    allGroups.forEach((group) => {
      socket.emit("group-joined", group);
    });

    socket.broadcast.emit("newuserjoined", {
      img: currentuser.img,
      username: currentuser.username,
      lastmessage: "hello!",
    });

    currentuser.socketId = socket.id;
    await currentuser.save();
  });

  socket.on("disconnect", async () => {
    await usermodel.findOneAndUpdate({ socketId: socket.id }, { socketId: "" });
  });

  socket.on("privateMessage", async (msgobj) => {
    // console.log(msgobj);

    await msgmodel.create({
      msg: msgobj.msg,
      sender: msgobj.sender,
      receiver: msgobj.receiver,
    });

    const receiver = await usermodel.findOne({ username: msgobj.receiver });

    if (!receiver) {
      /* 
            jab receiver nhi milege
             */

      const group = await groupmodel
        .findOne({
          name: msgobj.receiver,
        })
        .populate("users");

      if (!group) {
        /* 
                agar group nhi mila
                 */

        return;
      }

      group.users.forEach((user) => {
        socket.to(user.socketId).emit("recievedprivatemsg", msgobj);
      });

      /* send message to users in group */
    }
    if (receiver) {
      socket.to(receiver.socketId).emit("recievedprivatemsg", msgobj);
    }
  });

  socket.on("sendimg", async (data) => {
    console.log(data);
    var dets = await msgmodel.create({
      sender: data.sender,
      receiver: data.receiver,
      filepicture: data.img,
    });
    const toUser = await usermodel.findOne({ username: data.receiver });

    if (!toUser) {
      /* 
            jab receiver nhi milege
             */

      const group = await groupmodel
        .findOne({
          name: data.receiver,
        })
        .populate("users");

      if (!group) {
        /* 
                agar group nhi mila
                 */

        return;
      }

      group.users.forEach((user) => {
        socket.to(user.socketId).emit("recievedprivateimg", data);
      });

      /* send message to users in group */
    }
    if (toUser) {
      socket.to(toUser.socketId).emit("recievedprivateimg", data);
    }

    // socket.to(toUser.socketId).emit("recievedprivateimg",data)
  });

  socket.on("getMessage", async (users) => {
    const isUser = await usermodel.findOne({
      username: users.receiver /* insta */,
    });
    if (isUser) {
      const allMessages = await msgmodel.find({
        $or: [
          {
            sender: users.receiver /* b */,
            receiver: users.sender /* a */,
          },
          {
            receiver: users.receiver /* b */,
            sender: users.sender /* a */,
          },
        ],
      });
      socket.emit("chatmessages", allMessages);
    } else {
      const allMessages = await msgmodel.find({
        receiver: users.receiver /* insta */,
      });

      socket.emit("chatmessages", allMessages);
    }
  });

  socket.on("join-group", async (joiningDetails) => {
    const group = await groupmodel.findOne({
      name: joiningDetails.groupName,
    });

    const User = await usermodel.findOne({
      username: joiningDetails.sender,
    });
    // console.log(User);
    group.users.push(User._id);

    await group.save();

    socket.emit("group-joined", {
      profileImage: group.profileImage,
      name: group.name,
    });
  });
});
// end of socket.io logic

module.exports = socketapi;

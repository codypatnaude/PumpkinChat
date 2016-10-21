let express = require('express')
let app = express()
let http = require('http').createServer(app)
let io = require('socket.io')(http)
let chatRoom = require('./chatRoomFactory.js')
let path = require('path')
let rootPath = path.normalize(__dirname)
let totalUserCount = 0

//let users = []
//let usercount = 0
let chatRooms = new Array()
function getChatRoom(name){
  return chatRooms.find(function(elem, index, array){
    return elem.chatRoomName() == name
  })
}

app.use(express.static(rootPath))

app.get('/*', function(req, res){

  if(!getChatRoom(req.originalUrl)){
    console.log('creating chatroom ' + req.originalUrl)
    chatRooms.push(new chatRoom(req.originalUrl))
  }

  res.sendFile(rootPath + '/pageWrapper.html')
})

io.on('connection', function(socket){
  totalUserCount++
  console.log('connected to user ' + totalUserCount)

  let myUser = {
    id: totalUserCount,
    socket: socket
  }

  console.log('sending url request')
  io.to(socket.id).emit('urlrequest')

/*
  console.log('User ' + myUser.id + ' has connected')

  room.addUser(myUser)

  let roomUsers = room.users()

  console.log("room now has " + room.users().length + " users")

  for(let i = 0;i < roomUsers.length;i++){
    let curUser = roomUsers[i]

    if(curUser.id === myUser.id){
      io.to(curUser.socket.id).emit('chat', 'You have joined the chat')
    }else{
      io.to(curUser.socket.id).emit('chat', 'User ' + myUser.id + ' has joined the chat')
    }
  }
*/
  socket.on('urlresponse', function(msg){

    console.log('received url response from ' + myUser.id)
    let room = getChatRoom(msg)

    if(!room){
      console.log('creating chatroom ' + msg)
      room = new chatRoom(msg)
      chatRooms.push(room)
      room.addUser(myUser)
    }
    roomUsers = room.users()

    if(!roomUsers.find(function(elem, index, array){
      return elem.id == myUser.id
    })){
      room.addUser(myUser)
    }

    for(let i = 0; i < roomUsers.length;i++){
      let curUser = roomUsers[i]

      io.to(curUser.socket.id).emit('chat', JSON.stringify({
        message : 'User ' + myUser.id + ' has entered the chat',
        room : msg
      }))
    }

    io.to(myUser.socket.id).emit('chat', JSON.stringify({
      message : 'You have entered the chat (User' + myUser.id + ')',
      room : msg
    }))
  })



  socket.on('chat', function(msg){
    console.log('message: ' + msg)
    let msgObj = JSON.parse(msg)
    let message = msgObj.message
    let chatRoomName = msgObj.room
    let room = getChatRoom(chatRoomName)

    if(!room){
      console.log('something horrible happened')
      console.log('chatroom ' + chatRoomName)
      console.log('creating chatroom')
      room = new chatRoom(chatRoomName)
      chatRooms.push(room)
      room.addUser(myUser)
    }else{
      let roomUsers = room.users()
      //console.log("chat name" + room.chatRoomName())
      //console.log(room)
      //console.log('room users' + roomUsers)
      for(let i = 0; i < roomUsers.length;i++){
        let curUser = roomUsers[i]
        console.log("CurUser" + curUser.id + " : " + myUser.id)

        if(curUser.id === myUser.id){
          io.to(curUser.socket.id).emit('chat', JSON.stringify({
            message : 'You: ' + message,
            room : chatRoomName
          }))
        }else{
          io.to(curUser.socket.id).emit('chat', JSON.stringify({
            message : 'User ' + myUser.id + ': ' + message,
            room : chatRoomName
          }))
        }

      }
    }


  })

  socket.on('disconnect', function(){
    io.emit('chat', 'User ' + myUser.id + ' has left the chat')
  })
})

http.listen(80, function(){
  console.log('listening on 80')
})

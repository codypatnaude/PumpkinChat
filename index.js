//
//Includes
//
let express = require('express')
let app = express()
let http = require('http').createServer(app)
let io = require('socket.io')(http)
let path = require('path')

//Globals
let rootPath = path.normalize(__dirname)
let users = []
let usercount = 0

app.use(express.static(rootPath))

app.get('/*', function(req, res){
  res.sendFile(rootPath + '/pageWrapper.html')
})

io.on('connection', function(socket){
  usercount++
  console.log('connected to user ' + usercount)

  let myUser = {
    id: usercount,
    socket: socket
  }

  users.push(myUser)

  console.log('sending url request')
  io.to(socket.id).emit('urlrequest')

  socket.on('urlresponse', function(room){

    console.log('received url response from ' + myUser.id)
    myUser.room = room

    roomUsers = users.filter(function(elem){
      return elem.room == room && elem.id != myUser.id
    })

    roomUsers.forEach(function(elem){
      io.to(elem.socket.id).emit('chat', JSON.stringify({
        message : 'User ' + myUser.id + ' has entered the chat',
        room : room
      }))
    })

    io.to(myUser.socket.id).emit('chat', JSON.stringify({
      message : 'You have entered the chat (User' + myUser.id + ')',
      room : room
    }))
  })

  socket.on('chat', function(msg){
    let msgObj = JSON.parse(msg)
    let message = msgObj.message
    let room = msgObj.room

    let roomUsers = users.filter(function(elem){
      return elem.room == room && elem.id != myUser.id
    })

    roomUsers.forEach(function(elem){
      io.to(elem.socket.id).emit('chat', JSON.stringify({
        message : 'User ' + myUser.id + ': ' + message,
        room : room
      }))
    })

    io.to(myUser.socket.id).emit('chat', JSON.stringify({
      message : 'You: ' + message,
      room : room
    }))
  })

  socket.on('disconnect', function(){
    console.log('user has left')
    users = users.filter(function(elem){
      elem.id != myUser.id
    })

    let roomUsers = users.filter(function(elem){
      return elem.room == room && elem.id != myUser.id
    })

    roomUsers.forEach(function(elem){
      io.to(elem.socket.id).emit('chat', JSON.stringify({
        message : 'User ' + myUser.id + ': has left the chat',
        room : room
      }))
    })
  })
})

http.listen(process.env.PORT || 3000, function(){
  console.log('listening on 3000')
})

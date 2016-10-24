//
//Includes
//
let express = require('express')
let app = express()
let striptags = require('striptags')
let http = require('http').createServer(app)
let io = require('socket.io')(http)
let path = require('path')

//Globals
let rootPath = path.normalize(__dirname)
let users = []
let usercount = 0

function processMsg(msg){
  let message = striptags(msg) // don't inject me bruh
  let re = /^\/([a-z]+)\s(.*)/g;
  let match = re.exec(message)
  let valid=true
  if (match) {
    let cmd = match[1], arg = match[2]
    console.log(cmd); 
    console.log(arg); 

    //images (and maybe other commands...)
    switch (cmd) {
      case 'img':
       message = '<img src="'+arg+'"/>'
       break
      default:
        message = 'INVALID COMMAND MEATBAG' 
        valid = false
    }
  }
  return { contents : message, success : valid } 
}

app.use(express.static(rootPath))

app.get('/*', function(req, res){
  res.sendFile(rootPath + '/pageWrapper.html')
})

io.on('connection', function(socket){
  usercount++
  console.log('connected to user ' + usercount)

  let myUser = {
    id: usercount,
    socket: socket,
    attributes: new Array(),
    strikes: 0
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
    let message = processMsg(msgObj.message)
    let room = msgObj.room

    if(myUser.strikes >= 3){
      io.to(myUser.socket.id).emit('chat', JSON.stringify({
        message : 'The community has respectfully asked that you fuck off',
        room : room
      }))
      return
    }

    let roomUsers = users.filter(function(elem){
      return elem.room == room && elem.id != myUser.id
    })

	  if(message.success){
      roomUsers.forEach(function(elem){
        io.to(elem.socket.id).emit('chat', JSON.stringify({
          message : (myUser.name || 'User ' + myUser.id) + ': ' + message.contents,
          room : room
        }))
      })
	  }

    io.to(myUser.socket.id).emit('chat', JSON.stringify({
      message : 'You: ' + message.contents,
      room : room
    }))
  })

  socket.on('disconnect', function(){
    //console.log('user has left')
    //console.log("USERS:", users.length)
    users = users.filter(function(elem){
      return elem.id != myUser.id
    })
    //console.log("USERS:", users.length)
    room = myUser.room

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

  socket.on('settings', function(settings){
    console.log('settings for user ' + myUser.id + ' : ' + settings)

    let settingsArray = settings.split(";")
    settingsArray.forEach(function(elem){
      let x = elem.split("=")
      if(x[0] === 'name'){
        myUser.name = x[1]

      }else if(x[0] == 'kick'){
        let kickUserIndex = users.findIndex(function(elem, index, array){
          return (elem.name && elem.name == x[1]) || ('User' + elem.id == x[1])
        })

        kickUser = users[kickUserIndex]
        kickUser.strikes++

        if(kickUser.strikes >= 3){
          io.to(kickUser.socket.id).emit('chat', JSON.stringify(
            {message:'Apparently you\'re an asshole. You\'ve been kicked from this chat. Fuck off',
            room:kickUser.room})
          )
          users.splice(kickUserIndex, 1)
        }

      }else{
        myUser.attributes.push(elem)
      }
    })
  })
})

http.listen(process.env.PORT || 3000, function(){
  console.log('listening on 3000')
})

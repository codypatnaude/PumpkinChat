function chatRoom(name){

  //Users in the chatRoom
  let _users = new Array()
  let _usercount = 0
  let _chatRoomName = name

  return{

    addUser : function(user){
      console.log('adding user: ' + user)
      _users.push(user)
      _usercount++
    },

    removeUser : function(user){
      userIndex = _users.findIndex(function(elem, index, arr){
				return elem.id == user.id;
			})
      _users.splice(userIndex, 1)
    },

    users : function(){
      return _users
    },

    chatRoomName : function(){
      return _chatRoomName
    },

    userCount : function(){
      return _usercount
    }

  }
}

module.exports = chatRoom

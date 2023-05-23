import {useContext, useEffect, useRef, useState} from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import {UserContext} from "./UserContext.jsx";
import {get, uniqBy} from "lodash";
import axios from "axios";
import Contact from "./Contact";
import ContactView from "./header";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import {BsEmojiSmile} from 'react-icons/bs';


console.log(Picker)
export default function Chat() {
  const [ws,setWs] = useState(null);
  const [onlinePeople,setOnlinePeople] = useState({});
  const [offlinePeople,setOfflinePeople] = useState({});
  const [selectedUserId,setSelectedUserId] = useState(null);
  const [newMessageText,setNewMessageText] = useState('');
  const [messages,setMessages] = useState([]);
  const {username,id,setId,setUsername} = useContext(UserContext);
  const divUnderMessages = useRef();
  const [curChat,setCurChat] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const notifiedUsers = new Set();
  const [emojiShow, setEmojiShow] = useState(false);
  
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

    useEffect(() => {
      connectToWs();
    }, [selectedUserId]);
 
  function connectToWs() {
    const ws = new WebSocket('ws://localhost:5001');
    setWs(ws);
    ws.addEventListener('message', handleMessage);
    ws.addEventListener('connection', sendNotification);
    ws.addEventListener('close', () => {
      setTimeout(() => {
        console.log('Disconnected. Trying to reconnect.');
        connectToWs();
      }, 1000);
    });
  }

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({userId,username}) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }

  const addEmoji = (e) => {
    const sym = e.unified.split('_');
    const codesArray = [];
    sym.forEach(el => codesArray.push('0x' + el));
    const emoji = String.fromCodePoint(...codesArray);
    setNewMessageText(newMessageText + emoji);
  };
  

  function handleMessage(ev) { 
    const messageData = JSON.parse(ev.data);
    if ('online' in messageData) {
        showOnlinePeople(messageData.online);
        sendNotification(messageData.online);
    } else if ('text' in messageData) {
      if (messageData.sender === selectedUserId) {
        setMessages(prev => ([...prev, {...messageData}]));
      }
    }
  }

  function logout() {
    axios.post('/logout').then(() => {
      setWs(null);
      setId(null);
      setUsername(null);
    });
  }
  
  function sendNotification(data) {
    
    // Remove duplicates and exclude specific user
    const uniqueUsers = Array.from(new Set(data.map(u => u.userId)))
      .filter(userId => userId !== id)
      .map(userId => data.find(u => u.userId === userId));

    // Send notification for new online users
    uniqueUsers.forEach(user => {
    if (!notifiedUsers.has(user.userId)) {
      console.log(notifiedUsers.has(user.userId))
      console.log(`${user.username} is online`);
      if ('Notification' in window) {
        // Request permission for notifications
        Notification.requestPermission()
          .then(permission => {
            if (permission === 'granted') {
              // Create a new notification
              new Notification('Start Chatting now', {
                body:  user.username + ' is online',
                // Additional options can be specified here
              });
            }
          })
          .catch(error => {
            console.error('Error requesting notification permission:', error);
          });
      } else {
        console.log('Notifications are not supported in this browser.');
      }
      // Add the user to the notified users set
      notifiedUsers.add(user.userId);
    }
    });
  }

  function sendMessage(ev, file = null) {
    if (ev) ev.preventDefault();
    ws.send(JSON.stringify({
      recipient: selectedUserId,
      text: newMessageText,
      file,
    }));
    if (file) {
      axios.get('/messages/'+selectedUserId).then(res => {
        setMessages(res.data);
      });
    } else {
      setNewMessageText('');
      setMessages(prev => ([...prev,{
        text: newMessageText,
        sender: id,
        recipient: selectedUserId,
        _id: Date.now(),
      }]));
    }
  }
  
  function sendFile(ev) {
    const reader = new FileReader();
    reader.readAsDataURL(ev.target.files[0]);
    reader.onload = () => {
      sendMessage(null, {
        name: ev.target.files[0].name,
        data: reader.result,
      });
    };
  }

  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      div.scrollIntoView({behavior:'smooth', block:'end'});
    }
  }, [messages]);

  useEffect(() => {
    axios.get('/people').then(res => {
      const offlinePeopleArr = res.data
        .filter(p => p._id !== id)
        .filter(p => !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople = {};
      offlinePeopleArr.forEach(p => {
        offlinePeople[p._id] = p;
      });
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);

  useEffect(() => {
    if (selectedUserId) {
      axios.get('/messages/'+selectedUserId).then(res => {
        setMessages(res.data);
      });
    }
  }, [selectedUserId]);

  const onlinePeopleExclOurUser = {...onlinePeople};
  delete onlinePeopleExclOurUser[id];

  const messagesWithoutDupes = uniqBy(messages, '_id');

  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3 flex flex-col">
        <div className="flex-grow">
          <div className="flex justify-between">
            <Logo/>
            <span className="mr-2 text-m text-sky-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
              </svg>
              {username}
            </span>
          </div>
          <div className="flex items-center p-2 text-sm text-sky-500">
            Contacts
          </div>
          {Object.keys(onlinePeopleExclOurUser).map(userId => (
            <Contact
              key={userId}
              id={userId}
              online={true}
              username={onlinePeopleExclOurUser[userId]}
              onClick={() => {setSelectedUserId(userId); setCurChat(onlinePeopleExclOurUser[userId]); setIsOnline(true);}}
              selected={userId === selectedUserId} />
          ))}
          {Object.keys(offlinePeople).map(userId => (
            <Contact
              key={userId}
              id={userId}
              online={false}
              username={offlinePeople[userId].username}
              onClick={() => {setSelectedUserId(userId); setCurChat(offlinePeople[userId].username); setIsOnline(false);}}
              selected={userId === selectedUserId} />
          ))}
        </div>
        <div className="p-2 text-center flex-column items-center justify-center"> 
          <button
            onClick={logout}
            className="text-m bg-red-600 py-1 px-5 text-white border w-80 font-700 rounded-md">Logout</button>
        </div>
      </div>
      <div className="flex flex-col bg-blue-50 w-2/3 p-2">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex h-full flex-grow items-center justify-center">
              <div className="text-sky-600 text-xl">&larr; Click a Contact or Compose a New message</div>
            </div>
          )}
          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="header w-full bg-white h-20">
                <div className="flex items-center justify-between h-full">
                  {/* CHAT HEADER */} 
                  <div className="flex items-center gap-2">
                    {/* Make it show the username and active status */}
                    <ContactView
                      key={selectedUserId}
                      id={selectedUserId}
                      online={isOnline}
                      username={curChat}
                      onClick={() => {setSelectedUserId(selectedUserId); setCurChat(onlinePeopleExclOurUser[selectedUserId].username)}}
                      selected={selectedUserId === selectedUserId} />
                  </div>
                  <div className="relative cursor-pointer h-10 pd-4 flex items-center mx-10" onClick={toggleMenu}>
                      <div className="flex items-center justify-center">
                        <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                        <div className="w-1 h-1 ml-1 bg-gray-600 rounded-full"></div>
                        <div className="w-1 h-1 ml-1 bg-gray-600 rounded-full"></div>
                      </div>
                      {menuVisible && (
                        <div className="absolute right-0 top-5 z-10 mt-2 w-48 bg-white border rounded-md shadow-lg">
                          <div className="py-1">
                            <button className="block px-4 py-2 w-full text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-900">
                              Add {curChat} to Group
                            </button>
                            <button className="block px-4 py-2 w-full text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-900">
                              Poke {curChat}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                </div>
              </div>
              <div className="overflow-y-scroll absolute top-20 left-0 right-0 bottom-2">
                {messagesWithoutDupes.map(message => (
                  <div key={message._id} className={(message.sender === id ? 'text-right': 'text-left')}>
                    <div className={"text-left inline-block p-2 my-2 rounded-md text-sm " +(message.sender === id ? 'bg-blue-500 text-white':'bg-white text-gray-500')}>
                      {message.text}
                      {message.file && (
                        <div className="">
                          <a target="_blank" className="flex items-center gap-1 border-b" href={axios.defaults.baseURL + '/uploads/' + message.file}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
                            </svg>
                            {message.file}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessages}></div>
              </div>
            </div>
          )}
        </div>
        {!!selectedUserId && (
          <form className="flex gap-2" onSubmit={sendMessage}>
            <div className="w-full relative">
              <input id="inputbox" type="text"
                   value={newMessageText}
                   onChange={ev => setNewMessageText(ev.target.value)}
                   placeholder="Type your message here"
                   className="bg-white flex-grow border rounded-sm p-2 w-full"/>
                   <span onClick={()=>{
                    if(emojiShow){
                      setEmojiShow(false)
                    }else{
                      setEmojiShow(true)
                    }
                   }} className="absolute right-0 m-1 cursor-pointer bg-sky-100 py-2 rounded-md px-4 hover:bg-sky-200">
                    <BsEmojiSmile/>
                   </span>
                   {emojiShow && <div className="picker absolute bottom-12 right-0">
                      <Picker 
                         data={data}
                         emojiSize={20}
                         emojiButtonSize={30}
                         onEmojiSelect={addEmoji}
                         maxFrequentRows={4}
                      />
                   </div>}
            </div>
           
            <label className="bg-blue-200 p-2 text-gray-600 cursor-pointer rounded-sm border border-blue-200">
              <input type="file" className="hidden" onChange={sendFile} />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
              </svg>
            </label>
            <button onClick={()=>{setEmojiShow(false)}} type="submit" className="bg-blue-500 p-2 text-white rounded-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
import React from "react";


import { View, Platform, KeyboardAvoidingView } from "react-native";

// Gifted Chat
import { GiftedChat, Bubble, InputToolbar } from "react-native-gifted-chat";

// AsyncStorage for offline viewing
import AsyncStorage from '@react-native-async-storage/async-storage';

// NetInfo to see if user is online or not
import NetInfo from '@react-native-community/netinfo';


// Firebase as our database
import firebase from "firebase";
import("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyAKRyLhlgiIUvj4mwpmIHOpG2y4jJTwI6U",
  authDomain: "chat-94aef.firebaseapp.com",
  projectId: "chat-94aef",
  storageBucket: "chat-94aef.appspot.com",
  messagingSenderId: "810477279727",
  appId: "1:810477279727:web:4b7e39aab72402ac603e1a",
  measurementId: "G-BZP7THQVGN"
};

export default class Chat extends React.Component {
  constructor(props) {
    super(props);

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    // Check for updates in Firestore
    this.referenceChatMessages = firebase.firestore().collection("messages");
    this.referenceMessageUser = null;

    this.state = {
      messages: [],
      uid: 0,
      loggedInText: "Logging in...",
      user: {
        _id: "",
        name: "",
      },
      isConnected: false,
    };
  }

  addMessage() {
    const message = this.state.messages[0];
    // add the new messages to the collection
    this.referenceChatMessages.add({
      uid: this.state.uid,
      _id: message._id,
      text: message.text || "",
      createdAt: message.createdAt,
      user: message.user,
      image: message.image || null,
      location: message.location || null,
    });
  }

  onSend(messages = []) {
    this.setState(
      (previousState) => ({
        messages: GiftedChat.append(previousState.messages, messages),
      }),
      () => {
        this.addMessage();
        this.saveMessages();
      }
    );
  }

  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // go through each document
    querySnapshot.forEach((doc) => {
      // get the QueryDocumentSnapshot's data
      let data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        image: data.image || null,
        location: data.location || null,
        user: {
          _id: data.user._id,
          name: data.user.name,
        },
      });
    });
    this.setState({
      messages,
    });
  };

  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: "#1b064c",
          },
          left: {
            backgroundColor: "#FFF",
          },
        }}
      />
    );
  }

  async getMessages() {
    let messages = '';
    try {
      messages = await AsyncStorage.getItem('messages') || [];
      this.setState({
        messages: JSON.parse(messages)
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  async saveMessages() {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(this.state.messages));
    } catch (error) {
      console.log(error.message);
    }
  };

  async deleteMessages() {
    try {
      await AsyncStorage.removeItem('messages');
      this.setState({
        messages: []
      })
    } catch (error) {
      console.log(error.message);
    }
  };

  renderInputToolbar(props) {
    if (this.state.isConnected == false) {
    } else {
      return(
        <InputToolbar
        {...props}
        />
      );
    }
  };

  componentDidMount() {
    const name = this.props.route.params.username;
    this.props.navigation.setOptions({ title: name });

    // Check online status of user
    NetInfo.fetch().then((connection) => {
      if (connection.isConnected) {
        // online
        console.log("online");
        this.setState({
          isConnected: true,
        });

        this.getMessages();
        this.renderInputToolbar();

        this.authUnsubscribe = firebase.auth().onAuthStateChanged((user) => {
          if (!user) {
            firebase.auth().signInAnonymously();
          }
          this.setState({
            uid: user.uid,
            messages: [],
            user: {
              _id: user.uid,
              name: name,
            },
          });

          // Create reference to messages of active users
          this.referenceMessagesUser = firebase
            .firestore()
            .collection("messages")
            .where("uid", "==", this.state.uid);

          // Listen for collection changes
          this.unsubscribe = this.referenceChatMessages
            .orderBy("createdAt", "desc")
            .onSnapshot(this.onCollectionUpdate);
        });
      } else {
        // offline
        console.log("offline");
        this.setState({
          isConnected: false,
        });
        // hide Input Toolbar to prevent new messages in offline mode
        this.renderInputToolbar();

        // get messages from offline storage
        this.getMessages();
      }
    });
  };
    

  componentWillUnmount() {
    
      this.authUnsubscribe();
      this.unsubscribe();
    }

  render() {
    return (
      <View
        style={{
          flex: 1,

          backgroundColor: this.props.route.params.backgroundColor,
        }}
      >
        <GiftedChat
          renderBubble={this.renderBubble.bind(this)}
          messages={this.state.messages}
          messages={this.state.messages}
          onSend={(messages) => this.onSend(messages)}
          user={this.state.user}
        />
        {Platform.OS === "android" ? (
          <KeyboardAvoidingView behaviour="height" />
        ) : null}
        {/* This part is important for Issues with Android Keyboard covering Chat window */}
      </View>
      // </View>
    );
  }
}
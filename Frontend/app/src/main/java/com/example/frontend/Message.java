package com.example.frontend;

public class Message {
    private String messageText;
    private String sender;
    private long timestamp;

    public Message() {
        // Default constructor required for Firebase Realtime Database or Firestore
    }

    public Message(String messageText, String sender) {
        this.messageText = messageText;
        this.sender = sender;
        this.timestamp = System.currentTimeMillis(); // You can use any timestamp mechanism
    }

    public String getMessageText() {
        return messageText;
    }

    public void setMessageText(String messageText) {
        this.messageText = messageText;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}

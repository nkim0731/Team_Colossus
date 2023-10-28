package com.example.frontend;

import android.icu.text.SimpleDateFormat;

import java.util.Date;

public class Message {
    private String messageText;
    private String sender;
    private String timestamp;

    public Message() {
        // Default constructor required for Firebase Realtime Database or Firestore
    }

    // constructor to include timestamp from database messages
    public Message(String messageText, String sender, String timestamp) {
        this.messageText = messageText;
        this.sender = sender;
        this.timestamp = timestamp;
    }

    public Message(String messageText, String sender) {
        this.messageText = messageText;
        this.sender = sender;

        // Create a SimpleDateFormat object with the desired date and time format
        long currentTimeMillis = System.currentTimeMillis();
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        this.timestamp = dateFormat.format(currentTimeMillis);
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

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        this.timestamp = dateFormat.format(timestamp);
    }
}

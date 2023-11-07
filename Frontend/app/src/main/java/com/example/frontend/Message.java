package com.example.frontend;

import android.icu.text.SimpleDateFormat;

/*
 * Number of methods: 11
 * */
public class Message {
    private String messageText;
    private String sender;
    private String timestamp;

    private Boolean isSend; //true when it's sent by user, false when it's received by user

    /*
     * ChatGPT usage: No
     * */
    public Message() {

    }

    /*
     * ChatGPT usage: Partial
     * */
    // constructor to include timestamp from database messages
    public Message(String messageText, String sender, String timestamp, Boolean isSend) {
        this.messageText = messageText;
        this.sender = sender;
        this.timestamp = timestamp;
        this.isSend = isSend;
    }

    /*
     * ChatGPT usage: Partial
     * */
    public Message(String messageText, String sender, Boolean isSend) {
        this.messageText = messageText;
        this.sender = sender;
        this.isSend = isSend;

        // Create a SimpleDateFormat object with the desired date and time format
        long currentTimeMillis = System.currentTimeMillis();
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        this.timestamp = dateFormat.format(currentTimeMillis);
    }

    /*
     * ChatGPT usage: No
     * */
    public String getMessageText() {
        return messageText;
    }

    /*
     * ChatGPT usage: No
     * */
    public void setMessageText(String messageText) {
        this.messageText = messageText;
    }

    /*
     * ChatGPT usage: No
     * */
    public String getSender() {
        return sender;
    }

    /*
     * ChatGPT usage: No
     * */
    public void setSender(String sender) {
        this.sender = sender;
    }
    /*
     * ChatGPT usage: No
     * */
    public String getTimestamp() {
        return timestamp;
    }
    /*
     * ChatGPT usage: No
     * */
    public void setIsSend(Boolean isSend) {
        this.isSend = isSend;
    }
    /*
     * ChatGPT usage: No
     * */
    public void setTimestamp(long timestamp) {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        this.timestamp = dateFormat.format(timestamp);
    }
    /*
     * ChatGPT usage: No
     * */
    public Boolean getIsSend(){
        return isSend;
    }
}

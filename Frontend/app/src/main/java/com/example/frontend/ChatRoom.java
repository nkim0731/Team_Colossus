package com.example.frontend;

public class ChatRoom {
    private String ChatName;

    public ChatRoom(){

    }

    public ChatRoom(String name){
        this.ChatName = name;
    }

    public String getChatName(){
        return this.ChatName;
    }

    public void setChatName(String name){
        this.ChatName = name;
    }
}

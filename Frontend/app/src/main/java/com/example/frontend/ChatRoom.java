package com.example.frontend;

/*
 * Number of methods: 5
 * */
public class ChatRoom {
    private String ChatName;
    private String username;

    /*
     * ChatGPT usage: No
     * */
    public ChatRoom(){

    }

    /*
     * ChatGPT usage: No
     * */
    public ChatRoom(String name, String username){
        this.ChatName = name;
        this.username = username;
    }
    /*
     * ChatGPT usage: No
     * */
    public String getChatName(){
        return this.ChatName;
    }
    /*
     * ChatGPT usage: No
     * */
    public void setChatName(String name){
        this.ChatName = name;
    }
    /*
     * ChatGPT usage: No
     * */
    public String getUsername() {
        return this.username;
    }
}

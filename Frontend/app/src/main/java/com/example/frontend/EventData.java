package com.example.frontend;

/*
 * Number of methods: 4
 * */
public class EventData {
    private String startTime;
    private String eventName;
    private String duration;

    /*
     * ChatGPT usage: No
     * */
    public EventData(String startTime, String eventName, String duration) {

        this.startTime = startTime;
        this.eventName = eventName;
        this.duration = duration;
    }

    /*
     * ChatGPT usage: No
     * */
    public String getStartTime() {return this.startTime;}
    /*
     * ChatGPT usage: No
     * */
    public String getEventName() {return this.eventName;}
    /*
     * ChatGPT usage: No
     * */
    public String getDuration() {return this.duration;}



}

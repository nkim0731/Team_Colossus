package com.example.frontend;

import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.action.ViewActions.click;
import static androidx.test.espresso.action.ViewActions.closeSoftKeyboard;
import static androidx.test.espresso.action.ViewActions.typeText;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.hasErrorText;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.ViewMatchers.withId;
import static androidx.test.espresso.matcher.ViewMatchers.withText;

import android.util.Log;

import androidx.test.espresso.contrib.RecyclerViewActions;
import androidx.test.ext.junit.rules.ActivityScenarioRule;

import org.junit.Rule;
import org.junit.Test;

// 2 tests in CreateNewEventTest.java
// 1 test in ExampleInstrumentedTest.java
// 3 tests in preferenceTest.java
// 4 tests in SendMessageTest.java

public class SendMessageTest {
    @Rule
    public ActivityScenarioRule<GroupChat> activityRule =
            new ActivityScenarioRule<>(GroupChat.class);


    //ChatGPT usage: No
    @Test
    public void checkButtonEditDisplayed() {
        onView(withId(R.id.editTextSend))
                .check(matches(isDisplayed()));
        onView(withId(R.id.buttonSend))
                .check(matches(withText("send")));
    }



    //ChatGPT usage: Partial
    @Test
    public void InputExceedMaximumString() {

        //create string longer than 150 chars
        StringBuilder inputStringBuilder = new StringBuilder();
        for (int i = 0; i < 151; i++) {
            inputStringBuilder.append("1");
        }
        String inputString  = inputStringBuilder.toString();

        onView(withId(R.id.editTextSend))
                .perform(typeText(inputString),closeSoftKeyboard());
        onView(withId(R.id.buttonSend))
                .perform(click());
        //check error text is displayed
        onView(withId(R.id.editTextSend))
                .check(matches(hasErrorText("The messages is too long, it should be less than 150 characters")));


    }

    //ChatGPT usage: Partial
    @Test
    public void checkMessageSent() {
        //input message string
        onView(withId(R.id.editTextSend))
                .perform(typeText("hello world"),closeSoftKeyboard());

        //check editText store the message
        onView(withId(R.id.editTextSend))
                .check(matches(withText("hello world")));

        //click send button
        onView(withId(R.id.buttonSend))
                .perform(click());

    }

    //ChatGPT usage: Partial
    @Test
    public void checkNewMessageDisplayed(){
        checkMessageSent();
        onView(withId(R.id.recyclerView)).check(matches(isDisplayed()));
        onView(withId(R.id.recyclerView))
                .perform(RecyclerViewActions.scrollToPosition(1));

        onView(withText("hello world")).check(matches(isDisplayed()));

    }

    @Test
    public void checkMessageSpeed(){
        for(int i=0; i<5; i++){
            Log.d("MessageTest","Test"+(i+1)+":");
            checkMessageSent();
        }

    }

}

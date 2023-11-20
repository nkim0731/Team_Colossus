package com.example.frontend;

import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.ViewMatchers.withId;
import androidx.test.ext.junit.rules.ActivityScenarioRule;

import org.junit.Rule;
import org.junit.Test;

public class SendMessageTest {
    @Rule
    public ActivityScenarioRule<GroupChat> activityRule =
            new ActivityScenarioRule<>(GroupChat.class);

    @Test
    public void checkButtonEditDisplayed() {
        onView(withId(R.id.editTextSend)).check(matches(isDisplayed()));
        onView(withId(R.id.buttonSend)).check(matches(isDisplayed()));
    }


    @Test
    public void InputExceedMaximumString() {

    }

    @Test
    public void checkMessageSent() {

    }

}

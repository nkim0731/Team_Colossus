package com.example.frontend;

import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.action.ViewActions.click;
import static androidx.test.espresso.action.ViewActions.closeSoftKeyboard;
import static androidx.test.espresso.action.ViewActions.replaceText;
import static androidx.test.espresso.action.ViewActions.typeText;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.hasDescendant;
import static androidx.test.espresso.matcher.ViewMatchers.hasErrorText;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.ViewMatchers.withId;
import static androidx.test.espresso.matcher.ViewMatchers.withText;

import static junit.framework.TestCase.assertEquals;
import static org.hamcrest.core.IsInstanceOf.any;

import static org.hamcrest.Matchers.not;

import android.view.View;
import android.widget.EditText;

import androidx.test.espresso.contrib.RecyclerViewActions;
import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.rule.ActivityTestRule;

import org.hamcrest.Description;
import org.hamcrest.Matcher;
import org.hamcrest.TypeSafeMatcher;
import org.junit.Rule;
import org.junit.Test;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.time.format.DateTimeFormatter;
import java.util.regex.Pattern;

public class CreateNewEventTest {
    @Rule
    public ActivityScenarioRule<CreateNewEvent> calendarActivityActivityTestRule1
            = new ActivityScenarioRule<>(CreateNewEvent.class);

    //ChatGPT usage: No
    @Test
    public void checkValidInput(){

        onView(withId(R.id.et_eName)).perform(replaceText("cpen321"));
        onView(withId(R.id.et_location)).perform(replaceText("mcld"));
        onView(withId(R.id.et_sTime)).perform(replaceText("13:00"));
        onView(withId(R.id.et_eTime)).perform(replaceText("15:00"));

    }

    //ChatGPT usage: No
    @Test
    public void checkInvalidInput(){
        String invalidTimeFormat = "invalidTimeFormat";
        onView(withId(R.id.et_eName)).perform(replaceText("cpen321"));
        onView(withId(R.id.et_location)).perform(replaceText("mcld"));
        onView(withId(R.id.et_sTime)).perform(replaceText(invalidTimeFormat)); // Invalid time format
        onView(withId(R.id.et_eTime)).perform(replaceText("15:00"));

        onView(withId(R.id.et_sTime)).check(matches(not(hasValidTimeFormat())));
    }

    
    //ChatGPT usage: No
    private static Matcher<View> hasValidTimeFormat() {
        return new TypeSafeMatcher<View>() {
            @Override
            protected boolean matchesSafely(View item) {
                if (!(item instanceof EditText)) {
                    return false;
                }
                String text = ((EditText) item).getText().toString();

                // Use regex to check if the input matches "HHmm" format
                return Pattern.matches("^\\d{4}$", text);
            }

            @Override
            public void describeTo(Description description) {
                description.appendText("has valid time format (HHmm)");
            }
        };
    }
}

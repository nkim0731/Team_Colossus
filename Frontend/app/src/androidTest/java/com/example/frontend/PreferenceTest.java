package com.example.frontend;

import static androidx.test.espresso.Espresso.onData;
import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.action.ViewActions.click;
import static androidx.test.espresso.action.ViewActions.typeText;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.hasDescendant;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.ViewMatchers.withClassName;
import static androidx.test.espresso.matcher.ViewMatchers.withId;
import static androidx.test.espresso.matcher.ViewMatchers.withText;

;

import static org.hamcrest.core.Is.is;

import android.widget.EditText;

import androidx.test.espresso.action.ViewActions;
import androidx.test.espresso.contrib.RecyclerViewActions;
import androidx.test.ext.junit.rules.ActivityScenarioRule;

import org.junit.Rule;
import org.junit.Test;

public class PreferenceTest {
    @Rule
    public ActivityScenarioRule<PreferenceActivity> activityRule =
            new ActivityScenarioRule<>(PreferenceActivity.class);


    @Test
    public void checkPreferenceIsDisplayed() {
        onView(withId(R.id.list))
                .perform(RecyclerViewActions.scrollTo(hasDescendant(withText("Notifications"))))
                .check(matches(isDisplayed()));
        onView(withId(R.id.list))
                .perform(RecyclerViewActions.scrollTo(hasDescendant(withText("Alarms"))))
                .check(matches(isDisplayed()));
        onView(withId(R.id.list))
                .perform(RecyclerViewActions.scrollTo(hasDescendant(withText("Alerts"))))
                .check(matches(isDisplayed()));
        onView(withId(R.id.list))
                .perform(RecyclerViewActions.scrollTo(hasDescendant(withText("Location"))))
                .check(matches(isDisplayed()));
        onView(withId(R.id.list))
                .perform(RecyclerViewActions.scrollTo(hasDescendant(withText("Others"))))
                .check(matches(isDisplayed()));

    }

    @Test
    public void inputErrorAddress() {
        // open the address dialog
        onView(withId(R.id.list))
                .perform(RecyclerViewActions.scrollTo(hasDescendant(withText("Home location"))))
                .perform(click());

        //enter error address
        onView(withClassName(is(EditText.class.getName())))
                .perform(typeText("abc123"), ViewActions.closeSoftKeyboard());


        //click ok button
        onView(withText("OK")).perform(click());
    }


    @Test
    public void checkSave() {
    }

}

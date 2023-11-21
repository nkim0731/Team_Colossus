package com.example.frontend;

import android.content.Context;

import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.junit.Test;
import org.junit.runner.RunWith;

import static org.junit.Assert.*;


// 2 tests in CreateNewEventTest.java
// 1 test in ExampleInstrumentedTest.java
// 3 tests in preferenceTest.java
// 4 tests in SendMessageTest.java

// 27 unit tests in server.test.js
// 6 unit test in scheduler.test.js
// 5 unit tests in message.test.js
// 22 unit tests in database.test.js


/**
 * Instrumented test, which will execute on an Android device.
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
@RunWith(AndroidJUnit4.class)
public class ExampleInstrumentedTest {
    //ChatGPT usage: No
    @Test
    public void useAppContext() {
        // Context of the app under test.
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("com.example.frontend", appContext.getPackageName());
    }
}
package com.example.frontend;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.google.android.gms.location.ActivityTransition;
import com.google.android.gms.location.ActivityTransitionEvent;
import com.google.android.gms.location.ActivityTransitionResult;
import com.google.android.gms.location.DetectedActivity;

public class TransitionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (ActivityTransitionResult.hasResult(intent)) {
            ActivityTransitionResult result = ActivityTransitionResult.extractResult(intent);
            for (ActivityTransitionEvent event : result.getTransitionEvents()) {
                // chronological sequence of events....
                if (event.getActivityType() == DetectedActivity.STILL||
                        event.getActivityType() == DetectedActivity.WALKING) {
//                    if (event.getTransitionType() == ActivityTransition.ACTIVITY_TRANSITION_ENTER) {

//                    } else if (event.getTransitionType() == ActivityTransition.ACTIVITY_TRANSITION_EXIT) {
//                    }

                    Log.d("transition","I am still or walk");
                }
            }
        }
    }
}

package com.example.frontend;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;

import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.preference.EditTextPreference;
import androidx.preference.Preference;
import androidx.preference.PreferenceFragmentCompat;
import androidx.preference.PreferenceManager;

import org.json.JSONException;
import org.json.JSONObject;

public class SettingsFragment extends PreferenceFragmentCompat {
    private SharedPreferences.OnSharedPreferenceChangeListener preferenceChangeListener;
    private final String server_url = "http://10.0.2.2:3000"; // TODO update with VM
    private final String TAG = "Settings";
    private Bundle userData;
    private HttpsRequest httpsRequest;

    @Override
    public void onCreatePreferences(Bundle savedInstanceState, String rootKey) {
        setPreferencesFromResource(R.xml.preferences, rootKey);
        userData = getArguments();
        httpsRequest = new HttpsRequest();

//        Log.d(TAG, userData.getString("preferences"));

        //Set summary provide of each editText preference
        EditTextPreference preparation_time = findPreference("preparation_time");
        EditTextPreference max_missed_bus = findPreference("max_missed_bus");
        EditTextPreference snooze_duration = findPreference("snooze_duration");
        EditTextPreference home_location = findPreference("home_location");
        EditTextPreference school_location = findPreference("school_location");
        EditTextPreference work_location = findPreference("work_location");

        preparation_time.setSummaryProvider(new Preference.SummaryProvider<EditTextPreference>() {
            @Override
            public CharSequence provideSummary(EditTextPreference preference) {
                return preference.getText();
            }
        });
        max_missed_bus.setSummaryProvider(new Preference.SummaryProvider<EditTextPreference>() {
            @Override
            public CharSequence provideSummary(EditTextPreference preference) {
                return preference.getText();
            }
        });
        snooze_duration.setSummaryProvider(new Preference.SummaryProvider<EditTextPreference>() {
            @Override
            public CharSequence provideSummary(EditTextPreference preference) {
                return preference.getText();
            }
        });
        home_location.setSummaryProvider(new Preference.SummaryProvider<EditTextPreference>() {
            @Override
            public CharSequence provideSummary(EditTextPreference preference) {
                return preference.getText();
            }
        });
        school_location.setSummaryProvider(new Preference.SummaryProvider<EditTextPreference>() {
            @Override
            public CharSequence provideSummary(EditTextPreference preference) {
                return preference.getText();
            }
        });
        work_location.setSummaryProvider(new Preference.SummaryProvider<EditTextPreference>() {
            @Override
            public CharSequence provideSummary(EditTextPreference preference) {
                return preference.getText();
            }
        });

        //Handle preferences changes
        SharedPreferences sharedPreferences = getPreferenceManager().getSharedPreferences();

        preferenceChangeListener = (sharedPrefs, key) -> {
            JSONObject putData = new JSONObject();
            JSONObject preferencesObj = new JSONObject();
            try {
                putData.put("username", userData.getString("userEmail"));

                if(key.equals("morning_alarm")||key.equals("event_alarm")||key.equals("notifications")
                || key.equals("traffic_alerts")||key.equals("weather_alerts")||key.equals("vibration_alert")){
                    JSONObject notificationObj = new JSONObject();
                    notificationObj.put(key, sharedPreferences.getBoolean(key,false));
                    preferencesObj.put("notification_preferences", notificationObj);
                } else {
                    preferencesObj.put(key, sharedPreferences.getString(key,"default"));
                }
                putData.put("preferences", preferencesObj);

                httpsRequest.put(server_url + "/api/preferences", putData, new HttpsCallback() {
                    @Override
                    public void onResponse(String response) {
                        Log.d(TAG, response);
                    }
                    @Override
                    public void onFailure(String error) {
                        Log.d(TAG, error);
                    }
                });

            } catch (JSONException e) {
                throw new RuntimeException(e);
            }

            Log.d("Settings",key+" change");
        };

        // Register the listener
        sharedPreferences.registerOnSharedPreferenceChangeListener(preferenceChangeListener);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
}

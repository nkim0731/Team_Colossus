package com.example.frontend;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.widget.Switch;

import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.preference.EditTextPreference;
import androidx.preference.ListPreference;
import androidx.preference.Preference;
import androidx.preference.PreferenceFragmentCompat;
import androidx.preference.PreferenceManager;
import androidx.preference.SwitchPreferenceCompat;

import org.json.JSONException;
import org.json.JSONObject;

/*
 * Number of methods: 2
 * */
public class SettingsFragment extends PreferenceFragmentCompat {
    private SharedPreferences.OnSharedPreferenceChangeListener preferenceChangeListener;

    private final String server_url = ServerConfig.SERVER_URL;
    private final String TAG = "Settings";
    private Bundle userData;
    private HttpsRequest httpsRequest;

    /*
     * ChatGPT usage: Partial
     * */
    @Override
    public void onCreatePreferences(Bundle savedInstanceState, String rootKey) {
        setPreferencesFromResource(R.xml.preferences, rootKey);
        userData = getArguments();
        httpsRequest = new HttpsRequest();

        // Set summary provide of each editText preference
        EditTextPreference home_location = findPreference("home_location");
        EditTextPreference school_location = findPreference("school_location");
        EditTextPreference work_location = findPreference("work_location");
        EditTextPreference preparation_time = findPreference("preparation_time");
        EditTextPreference max_missed_bus = findPreference("maxMissedBus");
        EditTextPreference snooze_duration = findPreference("snooze_duration");

        // compats find preference
        SwitchPreferenceCompat morningAlarm = findPreference("morning_alarm");
        SwitchPreferenceCompat eventAlarm = findPreference("event_alarm");
        SwitchPreferenceCompat trafficAlerts = findPreference("traffic_alerts");
        SwitchPreferenceCompat weatherAlerts = findPreference("weather_alerts");
        SwitchPreferenceCompat vibrationAlerts = findPreference("vibration_alerts");
        ListPreference commuteMethod = findPreference("commute_method");

        // set values from data obtained in database for consistency
        try {
            JSONObject preferences = new JSONObject(userData.getString("preferences"));
            JSONObject notifications = new JSONObject(preferences.getString("notification_preferences"));
            // display the values
            commuteMethod.setSummary(preferences.getString("commute_method"));
            max_missed_bus.setText(preferences.getString("maxMissedBus"));

            morningAlarm.setChecked(notifications.getBoolean("morning_alarm"));
            eventAlarm.setChecked(notifications.getBoolean("event_alarm"));
            trafficAlerts.setChecked(notifications.getBoolean("traffic_alerts"));
            weatherAlerts.setChecked(notifications.getBoolean("weather_alerts"));
        } catch (JSONException e) {
            Log.e(TAG, "Error JSON exception");
        }

        commuteMethod.setOnPreferenceChangeListener((preference, newValue) -> {
            commuteMethod.setSummary(commuteMethod.getEntries()[commuteMethod.findIndexOfValue(newValue.toString())]);
            return true;
        });

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

    /*
     * ChatGPT usage: Yes
     * */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
}

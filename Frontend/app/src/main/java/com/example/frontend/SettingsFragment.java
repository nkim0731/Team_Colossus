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
    private String server_url;
    private String user_email;
    private final String TAG = "Settings";
    @Override
    public void onCreatePreferences(Bundle savedInstanceState, String rootKey) {
        setPreferencesFromResource(R.xml.preferences, rootKey);
        user_email = "sample@gmail.com"; //TODO fetch from Intent
        server_url = String.format("http://10.0.2.2:3000/api/users/%s/preferences",user_email);

        //Set summary provide of each editText preference
        EditTextPreference preparation_time= findPreference("preparation_time");
        EditTextPreference max_missed_bus= findPreference("max_missed_bus");
        EditTextPreference snooze_duration= findPreference("snooze_duration");
        EditTextPreference home_location= findPreference("home_location");
        EditTextPreference school_location= findPreference("school_location");
        EditTextPreference work_location= findPreference("work_location");
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
            HttpsRequest putRequest = new HttpsRequest();
            JSONObject putData = new JSONObject();
            try {
                if(key.equals("morning_alarm")||key.equals("event_alarm")||key.equals("notifications")
                || key.equals("traffic_alerts")||key.equals("weather_alerts")||key.equals("vibration_alert")){
                    putData.put(key, sharedPreferences.getBoolean(key,false));
                }else{
                    putData.put(key, sharedPreferences.getString(key,"default"));
                }


                putRequest.put(server_url, putData, new HttpsCallback() {
                    @Override
                    public void onResponse(String response) {
                        Log.d(TAG,response);
                    }

                    @Override
                    public void onFailure(String error) {
                        Log.d(TAG,error);
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

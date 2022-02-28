<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

	'facebook' => [
		'client_id' => '342328403977423',
		'client_secret' => '113faccd4d15a94822cf5b86e82e8c59',
		'redirect' => 'https://shrewd.online/auth/facebook/callback',
	],
	'google' => [
		'client_id' =>'488995353804-cgdl6ps1jvif2gncrsbaj1vgn6f48e32.apps.googleusercontent.com',
		'client_secret' => '4eIPyQmNsb44euJ6YwqS1J1p',
		'redirect' => 'https://appsec.study/auth/google/callback',
	],
];

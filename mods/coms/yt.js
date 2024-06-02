//Imports«

import { util, api as capi } from "util";
import { globals } from "config";
const { NS } =globals;
const{strnum, isarr, isstr, isnum, isobj, log, jlog, cwarn, cerr}=util;
const fs = NS.api.fs;

//»
//Var«

const DEF_YT_ID = "cnY5YK2ttaM";

//»

//Notes«
/*

In terms of the whole youtube-dl/yt-dlp workflow:

I am going to assume that you know all the meta stuff for a given video id, taken from
the Youtube API (https://www.googleapis.com/youtube/v3/). The only things you might not
know are the available downloadable formats (webm/mp4/m4a audio/video resolutions/bitrates).

To check for videos, we want to see if we have filenames that match /^title/ (with all 
bad characters removed).

*/
/*Youtube API 'fields' parameter syntax«

https://www.googleapis.com/youtube/v3/something?part=skrumpt,cheeg&fields=... 

Comma-separated list to select multiple fields
	fields=a,b

Asterisk as a wildcard to identify all fields
	fields=*

Parentheses to specify a group of nested properties
	fields=a(b,c)

Forward slash to identify a nested property
	fields=a/b

»*/
//»
/*«
Hill Street Blues:
PL4i-j8jNxLhqWNkPcoe4ZyxTSTEftWyNs: Season 3

Twilight zone episodes:
PLNvfr3aPMv9cQ7CATYePMtqPro1I9k7ZE: The Twilight Zone 1960s Episodes
PLXhyaOtvjvQbY-w5M8q8-NjIkBrYWcHG9: The New Twilight Zone 1985 - Complete TV Series
PL3DZDfUJJy6ZHxGVJKAygq_2oxkoOrRIg: The Twilight Zone Full Episodes
PLjuR5ouJJf7rFMnBKGa233WGVTR2zhqA1: "	"		 " 	  "	   "

Dragnet episodes:
PLiPNgE-Z-5RRqsGzlKKJGw8957FF4_tzK: Dragnet TV Series-Full Episodes
PL6U_Lk_PlFCUTpBbwsUj-I2gdz2enIxVn:	"		"	"		"	"
PL5q8VRGX_yLKbiZOlE3_qCZdMe7tg15qV:	"		"	"		"	"
PL_OVlzi87KEglWT-hCbP1VBQHsz8qWWTi: Dragnet 1967

Bonanza:
PLiPNgE-Z-5RSUDAx-6PTd49RI90KkBUwW: 

Cheers:
PL1RaM8eddoiqBuDFeeLOcK4ejlm7rGM-b
PL1RaM8eddoiqIlD5j5IfTeZ6iftC7KFI_
PL1RaM8eddoipG2wk_PIGbR2QlP933Wz67

Sealab 2021:
PLY0uKMaaNnrOGCkfJY1MY4T2kSflw5Vq0
PLY0uKMaaNnrPOWnbFndLGb6uPlp1Z41vA

»*/
const sleep = (ms)=>{//«
	if (!Number.isFinite(ms)) ms = 0;
	return new Promise((Y,N)=>{
		setTimeout(Y, ms);
	});
};//»

const com_ytsrch=async(args,o)=>{//«
//Use Youtube API to search for videos, channels or playlists
const cberr=(arg)=>{//«
	if (!arg) arg="Unknown error";
	err.push(arg);
	return {err}
};//»

/*«Parameters

Required parameters//«

part//«

string

The part parameter specifies a comma-separated list of one or more search
resource properties that the API response will include. Set the parameter value
to snippet.

//»

//»

Filters (specify 0 or 1 of the following parameters)//«

relatedToVideoId//«

string

The relatedToVideoId parameter retrieves a list of videos that are related to
the video that the parameter value identifies. The parameter value must be set
to a YouTube video ID and, if you are using this parameter, the type parameter
must be set to video.

Note that if the relatedToVideoId parameter is set, the only other supported
parameters are part, maxResults, pageToken, regionCode, relevanceLanguage,
safeSearch, type (which must be set to video), and fields.

//»

forContentOwner//«

boolean

This parameter can only be used in a properly authorized request, and it is
intended exclusively for YouTube content partners.

The forContentOwner parameter restricts the search to only retrieve videos
owned by the content owner identified by the onBehalfOfContentOwner parameter.
If forContentOwner is set to true, the request must also meet these
requirements:

The onBehalfOfContentOwner parameter is required.

The user authorizing the request must be using an account linked to the
specified content owner.

The type parameter value must be set to video.

None of the following other parameters can be set: videoDefinition,
videoDimension, videoDuration, videoLicense, videoEmbeddable, videoSyndicated,
videoType.

//»
forDeveloper//«

boolean

This parameter can only be used in a properly authorized request. The
forDeveloper parameter restricts the search to only retrieve videos uploaded
via the developer's application or website. The API server uses the request's
authorization credentials to identify the developer. The forDeveloper parameter
can be used in conjunction with optional search parameters like the q
parameter.

For this feature, each uploaded video is automatically tagged with the project
number that is associated with the developer's application in the Google
Developers Console.

When a search request subsequently sets the forDeveloper parameter to true, the
API server uses the request's authorization credentials to identify the
developer. Therefore, a developer can restrict results to videos uploaded
through the developer's own app or website but not to videos uploaded through
other apps or sites.

//»
forMine//«

boolean

This parameter can only be used in a properly authorized request. The forMine
parameter restricts the search to only retrieve videos owned by the
authenticated user. If you set this parameter to true, then the type
parameter's value must also be set to video. In addition, none of the following
other parameters can be set in the same request: videoDefinition,
videoDimension, videoDuration, videoLicense, videoEmbeddable, videoSyndicated,
videoType.

//»

//»

Optional parameters//«

//Search Filters«
q//«
string
The q parameter specifies the query term to search for.

Your request can also use the Boolean NOT (-) and OR (|) operators to exclude
videos or to find videos that are associated with one of several search terms.
For example, to search for videos matching either "boating" or "sailing", set
the q parameter value to boating|sailing. Similarly, to search for videos
matching either "boating" or "sailing" but not "fishing", set the q parameter
value to boating|sailing -fishing. Note that the pipe character must be
URL-escaped when it is sent in your API request. The URL-escaped value for the
pipe character is %7C.

//»
type//«
string
The type parameter restricts a search query to only retrieve a particular type of resource. The value is a comma-separated list of resource types. The default value is video,channel,playlist.

Acceptable values are:
channel
playlist
video//»
topicId//«
string

The topicId parameter indicates that the API response should only contain
resources associated with the specified topic. The value identifies a Freebase
topic ID.

Important: Due to the deprecation of Freebase and the Freebase API, the topicId
parameter started working differently as of February 27, 2017. At that time,
YouTube started supporting a small set of curated topic IDs, and you can only
use that smaller set of IDs as values for this parameter.

See topic IDs supported as of February 15, 2017

Topics

Music topics//«
/m/04rlf
Music (parent topic)
/m/02mscn
Christian music
/m/0ggq0m
Classical music
/m/01lyv
Country
/m/02lkt
Electronic music
/m/0glt670
Hip hop music
/m/05rwpb
Independent music
/m/03_d0
Jazz
/m/028sqc
Music of Asia
/m/0g293
Music of Latin America
/m/064t9
Pop music
/m/06cqb
Reggae
/m/06j6l
Rhythm and blues
/m/06by7
Rock music
/m/0gywn
Soul music
//»
Gaming topics//«
/m/0bzvm2
Gaming (parent topic)
/m/025zzc
Action game
/m/02ntfj
Action-adventure game
/m/0b1vjn
Casual game
/m/02hygl
Music video game
/m/04q1x3q
Puzzle video game
/m/01sjng
Racing video game
/m/0403l3g
Role-playing video game
/m/021bp2
Simulation video game
/m/022dc6
Sports game
/m/03hf_rm
Strategy video game//»
Sports topics//«
/m/06ntj
Sports (parent topic)
/m/0jm_
American football
/m/018jz
Baseball
/m/018w8
Basketball
/m/01cgz
Boxing
/m/09xp_
Cricket
/m/02vx4
Football
/m/037hz
Golf
/m/03tmr
Ice hockey
/m/01h7lh
Mixed martial arts
/m/0410tth
Motorsport
/m/07bs0
Tennis
/m/07_53
Volleyball//»
Entertainment topics//«
/m/02jjt
Entertainment (parent topic)
/m/09kqc
Humor
/m/02vxn
Movies
/m/05qjc
Performing arts
/m/066wd
Professional wrestling
/m/0f2f9
TV shows
//»
Lifestyle topics//«
/m/019_rr
Lifestyle (parent topic)
/m/032tl
Fashion
/m/027x7n
Fitness
/m/02wbm
Food
/m/03glg
Hobby
/m/068hy
Pets
/m/041xxh
Physical attractiveness [Beauty]
/m/07c1v
Technology
/m/07bxq
Tourism
/m/07yv9
Vehicles//»
Society topics//«
/m/098wr
Society (parent topic)
/m/09s1f
Business
/m/0kt51
Health
/m/01h6rj
Military
/m/05qt0
Politics
/m/06bvp
Religion//»
Other topics//«
/m/01k8wb
Knowledge//»

//»
eventType//«
string

The eventType parameter restricts a search to broadcast events. If you specify
a value for this parameter, you must also set the type parameter's value to
video.

Acceptable values are:
completed – Only include completed broadcasts.
live – Only include active broadcasts.
upcoming – Only include upcoming broadcasts.//»
safeSearch//«

string

The safeSearch parameter indicates whether the search results should include
restricted content as well as standard content.

Acceptable values are:

moderate – YouTube will filter some content from search results and, at the
least, will filter content that is restricted in your locale. Based on their
content, search results could be removed from search results or demoted in
search results. This is the default parameter value.

none – YouTube will not filter the search result set.

strict – YouTube will try to exclude all restricted content from the search
result set. Based on their content, search results could be removed from search
results or demoted in search results.

//»
//»
//Channel«
channelId//«
string

The channelId parameter indicates that the API response should only contain
resources created by the channel.

Note: Search results are constrained to a maximum of 500 videos if your request
specifies a value for the channelId parameter and sets the type parameter value
to video, but it does not also set one of the forContentOwner, forDeveloper, or
forMine filters.

//»
channelType//«
string
The channelType parameter lets you restrict a search to a particular type of channel.

Acceptable values are:
any – Return all channels.
show – Only retrieve shows.//»
//»
//Video«
videoCaption//«
string
The videoCaption parameter indicates whether the API should filter video search results based on whether they have captions. If you specify a value for this parameter, you must also set the type parameter's value to video.

Acceptable values are:
any – Do not filter results based on caption availability.
closedCaption – Only include videos that have captions.
none – Only include videos that do not have captions.//»
videoCategoryId//«
string
The videoCategoryId parameter filters video search results based on their category. If you specify a value for this parameter, you must also set the type parameter's value to video.//»
videoDefinition//«
string
The videoDefinition parameter lets you restrict a search to only include either high definition (HD) or standard definition (SD) videos. HD videos are available for playback in at least 720p, though higher resolutions, like 1080p, might also be available. If you specify a value for this parameter, you must also set the type parameter's value to video.

Acceptable values are:
any – Return all videos, regardless of their resolution.
high – Only retrieve HD videos.
standard – Only retrieve videos in standard definition.//»
videoDimension//«
string
The videoDimension parameter lets you restrict a search to only retrieve 2D or 3D videos. If you specify a value for this parameter, you must also set the type parameter's value to video.

Acceptable values are:
2d – Restrict search results to exclude 3D videos.
3d – Restrict search results to only include 3D videos.
any – Include both 3D and non-3D videos in returned results. This is the default value.//»
videoDuration//«
string
The videoDuration parameter filters video search results based on their duration. If you specify a value for this parameter, you must also set the type parameter's value to video.

Acceptable values are:
any – Do not filter video search results based on their duration. This is the default value.
long – Only include videos longer than 20 minutes.
medium – Only include videos that are between four and 20 minutes long (inclusive).
short – Only include videos that are less than four minutes long.//»
videoEmbeddable//«
string
The videoEmbeddable parameter lets you to restrict a search to only videos that can be embedded into a webpage. If you specify a value for this parameter, you must also set the type parameter's value to video.

Acceptable values are:
any – Return all videos, embeddable or not.
true – Only retrieve embeddable videos.//»
videoLicense//«
string
The videoLicense parameter filters search results to only include videos with a particular license. YouTube lets video uploaders choose to attach either the Creative Commons license or the standard YouTube license to each of their videos. If you specify a value for this parameter, you must also set the type parameter's value to video.

Acceptable values are:
any – Return all videos, regardless of which license they have, that match the query parameters.
creativeCommon – Only return videos that have a Creative Commons license. Users can reuse videos with this license in other videos that they create. Learn more.
youtube – Only return videos that have the standard YouTube license.//»
videoSyndicated//«
string
The videoSyndicated parameter lets you to restrict a search to only videos that can be played outside youtube.com. If you specify a value for this parameter, you must also set the type parameter's value to video.

Acceptable values are:
any – Return all videos, syndicated or not.
true – Only retrieve syndicated videos.//»
videoType//«
string
The videoType parameter lets you restrict a search to a particular type of videos. If you specify a value for this parameter, you must also set the type parameter's value to video.

Acceptable values are:
any – Return all videos.
episode – Only retrieve episodes of shows.
movie – Only retrieve movies.
//»
//»
//Region/Location«
relevanceLanguage//«

string

The relevanceLanguage parameter instructs the API to return search results that
are most relevant to the specified language. The parameter value is typically
an ISO 639-1 two-letter language code. However, you should use the values
zh-Hans for simplified Chinese and zh-Hant for traditional Chinese. Please note
that results in other languages will still be returned if they are highly
relevant to the search query term.

//»
regionCode//«
string

The regionCode parameter instructs the API to return search results for videos
that can be viewed in the specified country. The parameter value is an ISO
3166-1 alpha-2 country code.

//»
location//«

string

The location parameter, in conjunction with the locationRadius parameter,
defines a circular geographic area and also restricts a search to videos that
specify, in their metadata, a geographic location that falls within that area.
The parameter value is a string that specifies latitude/longitude coordinates
e.g. (37.42307,-122.08427).

The location parameter value identifies the point at the center of the area.

The locationRadius parameter specifies the maximum distance that the location
associated with a video can be from that point for the video to still be
included in the search results.

The API returns an error if your request specifies a value for the location
parameter but does not also specify a value for the locationRadius parameter.

Note: If you specify a value for this parameter, you must also set the type
parameter's value to video.

//»
locationRadius//«

string

The locationRadius parameter, in conjunction with the location parameter,
defines a circular geographic area.

The parameter value must be a floating point number followed by a measurement
unit. Valid measurement units are m, km, ft, and mi. For example, valid
parameter values include 1500m, 5km, 10000ft, and 0.75mi. The API does not
support locationRadius parameter values larger than 1000 kilometers.

Note: See the definition of the location parameter for more information.//»
//»
//Results/Ordering«
maxResults//«
unsigned integer

The maxResults parameter specifies the maximum number of items that should be
returned in the result set. Acceptable values are 0 to 50, inclusive. The
default value is 5.

//»
order//«
string
The order parameter specifies the method that will be used to order resources in the API response. The default value is relevance.

Acceptable values are:
date – Resources are sorted in reverse chronological order based on the date they were created.
rating – Resources are sorted from highest to lowest rating.
relevance – Resources are sorted based on their relevance to the search query. This is the default value for this parameter.
title – Resources are sorted alphabetically by title.
videoCount – Channels are sorted in descending order of their number of uploaded videos.
viewCount – Resources are sorted from highest to lowest number of views. For live broadcasts, videos are sorted by number of concurrent viewers while the broadcasts are ongoing.//»
pageToken//«
string
The pageToken parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken and prevPageToken properties identify other pages that could be retrieved.
publishedAfter
datetime
The publishedAfter parameter indicates that the API response should only contain resources created at or after the specified time. The value is an RFC 3339 formatted date-time value (1970-01-01T00:00:00Z).
publishedBefore
datetime
The publishedBefore parameter indicates that the API response should only contain resources created before or at the specified time. The value is an RFC 3339 formatted date-time value (1970-01-01T00:00:00Z).//»
//»

onBehalfOfContentOwner//«
string

This parameter can only be used in a properly authorized request. Note: This
parameter is intended exclusively for YouTube content partners.

The onBehalfOfContentOwner parameter indicates that the request's authorization
credentials identify a YouTube CMS user who is acting on behalf of the content
owner specified in the parameter value. This parameter is intended for YouTube
content partners that own and manage many different YouTube channels. It allows
content owners to authenticate once and get access to all their video and
channel data, without having to provide authentication credentials for each
individual channel. The CMS account that the user authenticates with must be
linked to the specified YouTube content owner.//»

//»

»*/
let err = [];
let {term, opts} = o;
if (!args.length) return cberr("No args");

let key = term.ENV["YT_KEY"];
if (!key) return cberr('YT_KEY is not set in the environment!');

//return key;
let types = [];
if (opts.video||opts.v) types.push("video");
if (opts.channel||opts.c) types.push("channel");
if (opts.playlist||opts.p) types.push("playlist");

let base ='https://www.googleapis.com/youtube/v3'; 
let url=`${base}/search?q=${args.join("+")}&maxResults=50&part=snippet`;
/*//«

 "kind": "youtube#video",//«
  "snippet": {

    "title": string,
    "description": string,
    "publishedAt": datetime,
    "channelId": string,
    "channelTitle": string,
    "categoryId": string,

    "tags":[ string ],
    "liveBroadcastContent": string,
    "defaultLanguage": string,
    "localized":{"title":string,"description":string},
    "defaultAudioLanguage": string,
    "thumbnails": {//«
      (key): {
        "url": string,
        "width": unsigned integer,
        "height": unsigned integer
      }
    },//»
  },
//»

 "kind": "youtube#playlist",//«
  "snippet": {

    "title": string,
    "description": string,
    "publishedAt": datetime,
    "channelId": string,
    "channelTitle": string,

    "defaultLanguage": string,
    "localized":{"title":string,"description":string},
    "thumbnails": {//«
      (key): {
        "url": string,
        "width": unsigned integer,
        "height": unsigned integer
      }
    },//»

  },
//»

  "kind": "youtube#channel",//«
  "snippet": {

    "title": string,
    "description": string,
    "publishedAt": datetime,
    "customUrl": string,

    "defaultLanguage": string,
    "localized":{"title":string,"description":string},
    "country": string,
    "thumbnails": {//«
      (key): {
        "url": string,
        "width": unsigned integer,
        "height": unsigned integer
      }
    },//»

  },//»


channelId: "UCD57pYXVsBNdDm87mimkByw"
channelTitle: "Scottish Hostels"
description: "At Scottish Hostels, all of our hostels are independently owned and run. They are great places to stay for people who don't need ..."
liveBroadcastContent: "none"
publishedAt//When channel was created
publishTime: "2012-04-10T12:28:41Z"
//»*/
//url += '&fields=items(snippet(channelId, channelTitle, description))';
let type_str = types.join(",");
if (type_str) url+=`&type=${type_str}`;
url+=`&key=${key}`;
let rv = await fetch(url);
if (!rv.ok){
	cberr(`Bad response: ${rv.status} (${rv.statusText})`);
	log(await rv.text());
	return;
}
return await rv.text();

};//»
const com_ytthing=async(args,o)=>{//Playlist/PlaylistItems/Channel«
//Use Youtube API to get a youtube channel, playlist information or playlist videos
let err = [];
const cberr=(arg)=>{//«
	if (!arg) arg="Unknown error";
	err.push(arg);
	return {err}
};//»
//«
/*Playlist«

{ //JSON«
  "kind": "youtube#playlist",
  "etag": etag,
  "id": string,
  "snippet": {
    "publishedAt": datetime,
    "channelId": string,
    "title": string,
    "description": string,
    "thumbnails": {
      (key): {
        "url": string,
        "width": unsigned integer,
        "height": unsigned integer
      }
    },
    "channelTitle": string,
    "defaultLanguage": string,
    "localized": {
      "title": string,
      "description": string
    }
  },
  "status": {
    "privacyStatus": string
  },
  "contentDetails": {
    "itemCount": unsigned integer
  },
  "player": {
    "embedHtml": string
  },
  "localizations": {
    (key): {
      "title": string,
      "description": string
    }
  }
}//»

Part names//«
contentDetails
id
localizations
player
snippet
status
//»

Filters (specify exactly one of the following parameters)//«

channelId string

This value indicates that the API should only return the specified channel's playlists.

id string

The id parameter specifies a comma-separated list of the YouTube playlist ID(s)
for the resource(s) that are being retrieved. In a playlist resource, the id
property specifies the playlist's YouTube playlist ID.

mine boolean

This parameter can only be used in a properly authorized request. Set this
parameter's value to true to instruct the API to only return playlists owned by
the authenticated user.
//»

Optional parameters//«

hl string//«

The hl parameter instructs the API to retrieve localized resource metadata for
a specific application language that the YouTube website supports. The
parameter value must be a language code included in the list returned by the
i18nLanguages.list method.

If localized resource details are available in that language, the resource's
snippet.localized object will contain the localized values. However, if
localized details are not available, the snippet.localized object will contain
resource details in the resource's default language.
//»

maxResults unsigned integer//«

The maxResults parameter specifies the maximum number of items that should be
returned in the result set. Acceptable values are 0 to 50, inclusive. The
default value is 5.
//»

onBehalfOfContentOwner string//«

This parameter can only be used in a properly authorized request. Note: This
parameter is intended exclusively for YouTube content partners.

The onBehalfOfContentOwner parameter indicates that the request's authorization
credentials identify a YouTube CMS user who is acting on behalf of the content
owner specified in the parameter value. This parameter is intended for YouTube
content partners that own and manage many different YouTube channels. It allows
content owners to authenticate once and get access to all their video and
channel data, without having to provide authentication credentials for each
individual channel. The CMS account that the user authenticates with must be
linked to the specified YouTube content owner.
//»

onBehalfOfContentOwnerChannel string//«

This parameter can only be used in a properly authorized request. Note: This
parameter is intended exclusively for YouTube content partners.

The onBehalfOfContentOwnerChannel parameter specifies the YouTube channel ID of
the channel to which a video is being added. This parameter is required when a
request specifies a value for the onBehalfOfContentOwner parameter, and it can
only be used in conjunction with that parameter. In addition, the request must
be authorized using a CMS account that is linked to the content owner that the
onBehalfOfContentOwner parameter specifies. Finally, the channel that the
onBehalfOfContentOwnerChannel parameter value specifies must be linked to the
content owner that the onBehalfOfContentOwner parameter specifies.

This parameter is intended for YouTube content partners that own and manage
many different YouTube channels. It allows content owners to authenticate once
and perform actions on behalf of the channel specified in the parameter value,
without having to provide authentication credentials for each separate channel.
//»

pageToken string//«

The pageToken parameter identifies a specific page in the result set that
should be returned. In an API response, the nextPageToken and prevPageToken
properties identify other pages that could be retrieved.
//»
//»

Get all playlists from a given channel:

/playlists?part=snippet&channelId=UCXXXXXXXXXXXXXXXXXXXXXX

*/

//Get playlist meta information (no actual videos)


//»
/*Playlist Items«

Required parameters//«

part string//«

The part parameter specifies a comma-separated list of one or more playlistItem
resource properties that the API response will include.

If the parameter identifies a property that contains child properties, the
child properties will be included in the response. For example, in a
playlistItem resource, the snippet property contains numerous fields, including
the title, description, position, and resourceId properties. As such, if you
set part=snippet, the API response will contain all of those properties.

The following list contains the part names that you can include in the parameter value:

contentDetails
id
snippet
status
//»

//»

Filters (specify exactly one of the following parameters)//«

id string//«

The id parameter specifies a comma-separated list of one or more unique
playlist item IDs.
//»
playlistId string//«

The playlistId parameter specifies the unique ID of the playlist for which you
want to retrieve playlist items. Note that even though this is an optional
parameter, every request to retrieve playlist items must specify a value for
either the id parameter or the playlistId parameter.
//»

//»

Optional parameters//«

maxResults unsigned integer//«

The maxResults parameter specifies the maximum number of items that should be
returned in the result set. Acceptable values are 0 to 50, inclusive. The
default value is 5.
//»

pageToken string//«

The pageToken parameter identifies a specific page in the result set that
should be returned. In an API response, the nextPageToken and prevPageToken
properties identify other pages that could be retrieved.

//»

videoId string//«

The videoId parameter specifies that the request should return only the
playlist items that contain the specified video.
//»

onBehalfOfContentOwner string//«

This parameter can only be used in a properly authorized request. Note: This
parameter is intended exclusively for YouTube content partners.

The onBehalfOfContentOwner parameter indicates that the request's authorization
credentials identify a YouTube CMS user who is acting on behalf of the content
owner specified in the parameter value. This parameter is intended for YouTube
content partners that own and manage many different YouTube channels. It allows
content owners to authenticate once and get access to all their video and
channel data, without having to provide authentication credentials for each
individual channel. The CMS account that the user authenticates with must be
linked to the specified YouTube content owner.
//»

//»

»*/
/*Channel«

Required parameters//«

part string//«
The part parameter specifies a comma-separated list of one or more channel resource properties that the API response will include.

If the parameter identifies a property that contains child properties, the child properties will be included in the response. For example, in a channel resource, the contentDetails property contains other properties, such as the uploads properties. As such, if you set part=contentDetails, the API response will also contain all of those nested properties.

The following list contains the part names that you can include in the parameter value:

auditDetails
brandingSettings
contentDetails
contentOwnerDetails
id
localizations
snippet
statistics
status
topicDetails
//»

Filters (specify exactly one of the following parameters)

categoryId string
This parameter has been deprecated. The categoryId parameter specified a YouTube guide category and could be used to request YouTube channels associated with that category.

forUsername string
The forUsername parameter specifies a YouTube username, thereby requesting the channel associated with that username.

id string
The id parameter specifies a comma-separated list of the YouTube channel ID(s) for the resource(s) that are being retrieved. In a channel resource, the id property specifies the channel's YouTube channel ID.

managedByMe boolean
This parameter can only be used in a properly authorized request. Note: This parameter is intended exclusively for YouTube content partners.

Set this parameter's value to true to instruct the API to only return channels managed by the content owner that the onBehalfOfContentOwner parameter specifies. The user must be authenticated as a CMS account linked to the specified content owner and onBehalfOfContentOwner must be provided.

mine boolean
This parameter can only be used in a properly authorized request. Set this parameter's value to true to instruct the API to only return channels owned by the authenticated user.
//»

Optional parameters//«

hl string//«
The hl parameter instructs the API to retrieve localized resource metadata for a specific application language that the YouTube website supports. The parameter value must be a language code included in the list returned by the i18nLanguages.list method.
If localized resource details are available in that language, the resource's snippet.localized object will contain the localized values. However, if localized details are not available, the snippet.localized object will contain resource details in the resource's default language.
//»

maxResults unsigned integer//«
The maxResults parameter specifies the maximum number of items that should be returned in the result set. Acceptable values are 0 to 50, inclusive. The default value is 5.
//»
onBehalfOfContentOwner string//«
This parameter can only be used in a properly authorized request. Note: This parameter is intended exclusively for YouTube content partners.
The onBehalfOfContentOwner parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.
//»

pageToken string//«
The pageToken parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken and prevPageToken properties identify other pages that could be retrieved.
//»

{ //JSON«
  "kind": "youtube#channel",
  "etag": etag,
  "id": string,
  "snippet": {
    "title": string,
    "description": string,
    "customUrl": string,
    "publishedAt": datetime,
    "thumbnails": {
      (key): {
        "url": string,
        "width": unsigned integer,
        "height": unsigned integer
      }
    },
    "defaultLanguage": string,
    "localized": {
      "title": string,
      "description": string
    },
    "country": string
  },
  "contentDetails": {
    "relatedPlaylists": {
      "likes": string,
      "favorites": string,
      "uploads": string
    }
  },
  "statistics": {
    "viewCount": unsigned long,
    "subscriberCount": unsigned long,  // this value is rounded to three significant figures
    "hiddenSubscriberCount": boolean,
    "videoCount": unsigned long
  },
  "topicDetails": {
    "topicIds": [
      string
    ],
    "topicCategories": [
      string
    ]
  },
  "status": {
    "privacyStatus": string,
    "isLinked": boolean,
    "longUploadsStatus": string,
    "madeForKids": boolean,
    "selfDeclaredMadeForKids": boolean
  },
  "brandingSettings": {
    "channel": {
      "title": string,
      "description": string,
      "keywords": string,
      "trackingAnalyticsAccountId": string,
      "moderateComments": boolean,
      "unsubscribedTrailer": string,
      "defaultLanguage": string,
      "country": string
    },
    "watch": {
      "textColor": string,
      "backgroundColor": string,
      "featuredPlaylistId": string
    }
  },
  "auditDetails": {
    "overallGoodStanding": boolean,
    "communityGuidelinesGoodStanding": boolean,
    "copyrightStrikesGoodStanding": boolean,
    "contentIdClaimsGoodStanding": boolean
  },
  "contentOwnerDetails": {
    "contentOwner": string,
    "timeLinked": datetime
  },
  "localizations": {
    (key): {
      "title": string,
      "description": string
    }
  }
}//»


//»

//Get Uploads playlist id by channel name
//This works: the input must be the LITERAL unique channel name (rather than the name that shows up next to the avatar)
// Should return: items(1) -> items[0].contentDetails.relatedPlaylists.uploads == 

»*/

//PL6uAUC9pJzA8byjHbA5p74CL10HUO0EtM

//Given: Channel id
//UU7AtGlWzcIfOXi64LdKfgxA

//Uploads playlist
//UC7AtGlWzcIfOXi64LdKfgxA
//»
let {term, opts} = o;

if (!args.length) return cberr("No args");

let key = term.ENV["YT_KEY"];
if (!key) return cberr('YT_KEY is not set in the environment!');

let list = opts.list;
let items = opts.items;
let channel = opts.channel;
if (!(list||items||channel)) return cberr("One of: --list, --items or --channel must be specified");

let base ='https://www.googleapis.com/youtube/v3'; 

let url;

//if (!id && id.match(/^[-_a-z0-9]{34}$/i)) return cberr("Bad list id (wanted 34 characters)???");
if (list) {
	let id = args.shift();
	url=`${base}/playlists?id=${id}&part=id,snippet,status,contentDetails`;
}
else if (items){
	let id = args.shift();
	url=`${base}/playlistItems?maxResults=50&playlistId=${id}&part=snippet,contentDetails`;
	url+='&fields=items(contentDetails(videoId),snippet(title))';
}
else if (channel){
	url=`${base}/channels?forUsername=${encodeURIComponent(args.join(" "))}&part=contentDetails`;
}
//log(url);
//return;

url+=`&key=${key}`;

//cbok();
//return;
let rv = await fetch(url);

if (!rv.ok){
	log(await rv.text());
	return cberr(`Bad response: ${rv.status} (${rv.statusText})`);
}
let txt = await rv.text();
if (items){
	let itms = (JSON.parse(txt)).items;
	let obj={};
	for (let it of itms){
		let tit = it.snippet.title;
		if (tit==="Deleted video") continue;
		obj[it.contentDetails.videoId] = tit;
	}
	txt = JSON.stringify(obj);
}
return txt;
};//»
const com_ytvid=async(args,_o)=>{//«
//Use Youtube API to get one or more video information objects
const cberr=(arg)=>{//«
	if (!arg) arg="Unknown error";
	err.push(arg);
	return {err}
};//»
let err = [];
let {term, opts} = _o;

if (!args.length) return cberr("No args");
let key = term.ENV["YT_KEY"];
if (!key) return cberr('YT_KEY is not set in the environment!');
let base ='https://www.googleapis.com/youtube/v3'; 

/*«

Required parameters//«

part string//«
The part parameter specifies a comma-separated list of one or more video resource properties that the API response will include.

If the parameter identifies a property that contains child properties, the child properties will be included in the response. For example, in a video resource, the snippet property contains the channelId, title, description, tags, and categoryId properties. As such, if you set part=snippet, the API response will contain all of those properties.

The following list contains the part names that you can include in the parameter value:
contentDetails
fileDetails
id
liveStreamingDetails
localizations
player
processingDetails
recordingDetails
snippet
statistics
status
suggestions
topicDetails
//»

//»

Filters (specify exactly one of the following parameters)//«

chart string//«
The chart parameter identifies the chart that you want to retrieve.

Acceptable values are:
mostPopular – Return the most popular videos for the specified content region and video category.
//»
id string//«

The id parameter specifies a comma-separated list of the YouTube video ID(s)
for the resource(s) that are being retrieved. In a video resource, the id
property specifies the video's ID.

//»
myRating string//«

This parameter can only be used in a properly authorized request. Set this
parameter's value to like or dislike to instruct the API to only return videos
liked or disliked by the authenticated user.

Acceptable values are:
dislike – Returns only videos disliked by the authenticated user.
like – Returns only video liked by the authenticated user.
//»

//»

Optional parameters//«

hl string//«

The hl parameter instructs the API to retrieve localized resource metadata for
a specific application language that the YouTube website supports. The
parameter value must be a language code included in the list returned by the
i18nLanguages.list method.

If localized resource details are available in that language, the resource's
snippet.localized object will contain the localized values. However, if
localized details are not available, the snippet.localized object will contain
resource details in the resource's default language.

//»
maxHeight unsigned integer//«
The maxHeight parameter specifies the maximum height of the embedded player returned in the player.embedHtml property. You can use this parameter to specify that instead of the default dimensions, the embed code should use a height appropriate for your application layout. If the maxWidth parameter is also provided, the player may be shorter than the maxHeight in order to not violate the maximum width. Acceptable values are 72 to 8192, inclusive.
//»
maxResults unsigned integer//«
The maxResults parameter specifies the maximum number of items that should be returned in the result set.

Note: This parameter is supported for use in conjunction with the myRating parameter, but it is not supported for use in conjunction with the id parameter. Acceptable values are 1 to 50, inclusive. The default value is 5.
//»
maxWidth unsigned integer//«
The maxWidth parameter specifies the maximum width of the embedded player returned in the player.embedHtml property. You can use this parameter to specify that instead of the default dimensions, the embed code should use a width appropriate for your application layout.

If the maxHeight parameter is also provided, the player may be narrower than maxWidth in order to not violate the maximum height. Acceptable values are 72 to 8192, inclusive.
//»
onBehalfOfContentOwner string//«
This parameter can only be used in a properly authorized request. Note: This parameter is intended exclusively for YouTube content partners.

The onBehalfOfContentOwner parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.
//»
pageToken string//«
The pageToken parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken and prevPageToken properties identify other pages that could be retrieved.

Note: This parameter is supported for use in conjunction with the myRating parameter, but it is not supported for use in conjunction with the id parameter.
//»
regionCode string//«

The regionCode parameter instructs the API to select a video chart available in
the specified region. This parameter can only be used in conjunction with the
chart parameter. The parameter value is an ISO 3166-1 alpha-2 country code.

//»
videoCategoryId string//«
The videoCategoryId parameter identifies the video category for which the chart should be retrieved. This parameter can only be used in conjunction with the chart parameter. By default, charts are not restricted to a particular category. The default value is 0.
//»

//»


// JSON « {
  "kind": "youtube#video",
  "etag": etag,
  "id": string,
  "snippet": {
    "publishedAt": datetime,
    "channelId": string,
    "title": string,
    "description": string,
    "thumbnails": {
      (key): {
        "url": string,
        "width": unsigned integer,
        "height": unsigned integer
      }
    },
    "channelTitle": string,
    "tags": [
      string
    ],
    "categoryId": string,
    "liveBroadcastContent": string,
    "defaultLanguage": string,
    "localized": {
      "title": string,
      "description": string
    },
    "defaultAudioLanguage": string
  },
  "contentDetails": {
    "duration": string,
    "dimension": string,
    "definition": string,
    "caption": string,
    "licensedContent": boolean,
    "regionRestriction": {
      "allowed": [
        string
      ],
      "blocked": [
        string
      ]
    },
    "contentRating": {
      "mpaaRating": string,
      "mpaatRating": string,
      "ytRating": string
    },
    "projection": string,
    "hasCustomThumbnail": boolean
  },
  "status": {
    "uploadStatus": string,
    "failureReason": string,
    "rejectionReason": string,
    "privacyStatus": string,
    "publishAt": datetime,
    "license": string,
    "embeddable": boolean,
    "publicStatsViewable": boolean,
    "madeForKids": boolean,
    "selfDeclaredMadeForKids": boolean
  },
  "statistics": {
    "viewCount": string,
    "likeCount": string,
    "dislikeCount": string,
    "favoriteCount": string,
    "commentCount": string
  },
  "player": {
    "embedHtml": string,
    "embedHeight": long,
    "embedWidth": long
  },
  "topicDetails": {
    "topicIds": [
      string
    ],
    "relevantTopicIds": [
      string
    ],
    "topicCategories": [
      string
    ]
  },
  "recordingDetails": {
    "recordingDate": datetime
  },
  "fileDetails": {
    "fileName": string,
    "fileSize": unsigned long,
    "fileType": string,
    "container": string,
    "videoStreams": [
      {
        "widthPixels": unsigned integer,
        "heightPixels": unsigned integer,
        "frameRateFps": double,
        "aspectRatio": double,
        "codec": string,
        "bitrateBps": unsigned long,
        "rotation": string,
        "vendor": string
      }
    ],
    "audioStreams": [
      {
        "channelCount": unsigned integer,
        "codec": string,
        "bitrateBps": unsigned long,
        "vendor": string
      }
    ],
    "durationMs": unsigned long,
    "bitrateBps": unsigned long,
    "creationTime": string
  },
  "processingDetails": {
    "processingStatus": string,
    "processingProgress": {
      "partsTotal": unsigned long,
      "partsProcessed": unsigned long,
      "timeLeftMs": unsigned long
    },
    "processingFailureReason": string,
    "fileDetailsAvailability": string,
    "processingIssuesAvailability": string,
    "tagSuggestionsAvailability": string,
    "editorSuggestionsAvailability": string,
    "thumbnailsAvailability": string
  },
  "suggestions": {
    "processingErrors": [
      string
    ],
    "processingWarnings": [
      string
    ],
    "processingHints": [
      string
    ],
    "tagSuggestions": [
      {
        "tag": string,
        "categoryRestricts": [
          string
        ]
      }
    ],
    "editorSuggestions": [
      string
    ]
  },
  "liveStreamingDetails": {
    "actualStartTime": datetime,
    "actualEndTime": datetime,
    "scheduledStartTime": datetime,
    "scheduledEndTime": datetime,
    "concurrentViewers": unsigned long,
    "activeLiveChatId": string
  },
  "localizations": {
    (key): {
      "title": string,
      "description": string
    }
  }
}
//»

Parts: comma separated list of top-level properties

search
let url=`${base}/search?key=${key}`;
let rv = await fetch(`${url}&q=${args.join("+")}`);

https://www.googleapis.com/youtube/v3/videos?id=7lCDEYXw3mM&key=YOUR_API_KEY
     
&fields=items(id,snippet(channelId,title,categoryId),statistics)
&part=snippet,statistics

categoryId: "27"
channelId: "UCP5tjEmvPItGyLhmjdwP7Ww"
channelTitle: "RealLifeLore"
defaultAudioLanguage: "en"
description: "The first 1,000 people to sign up for Skillshare will get their first 2 months for free; http://skl.sh/reallifelore14 \n\nGet RealLifeLore T-shirts here: http://standard.tv/reallifelore\n\nPlease Subscribe: http://bit.ly/2dB7VTO\n\nAnimations courtesy of Josh Sherrington of Heliosphere: https://www.youtube.com/c/heliosphere\n\nAdditional animations courtesy of David Powell\n\nFacebook: https://www.facebook.com/RealLifeLore/\nTwitter: https://twitter.com/RealLifeLore1\nReddit: https://www.reddit.com/r/RealLifeLore/\nInstagram: https://www.instagram.com/joseph_pise... \n\nSubreddit is moderated by Oliver Bourdouxhe\n\nSpecial thanks to my Patrons: Danny Clemens, Adam Kelly, Sarah Hughes, Greg Parham, Owen, Donna\n\nVideos explaining things. Mostly over topics like history, geography, economics and science. \n\nWe believe that the world is a wonderfully fascinating place, and you can find wonder anywhere you look. That is what our videos attempt to convey. \n\nCurrently, I try my best to release one video every week. Bear with me :)"
liveBroadcastContent: "none"
localized: {title: 'What Every Country in the World is Best At (Part 1)', description: 'The first 1,000 people to sign up for Skillshare w… to release one video every week. Bear with me :)'}
publishedAt: "2018-07-21T16:11:07Z"
tags: (18) ['real life lore', 'real life lore maps', 'real life lore geography', 'real life maps', 'world map', 'world map is wrong', 'world map with countries', 'world map real size', 'map of the world', 'world geography', 'geography', 'geography (field of study)', 'facts you didn’t know', 'what every country is best at', 'best in the world', 'every country in the world', 'part 1', 'country facts']
thumbnails: {default: {…}, medium: {…}, high: {…}, standard: {…}, maxres: {…}}
title: "What Every Country in the World is Best At (Part 1)"

items(id,statistics,snippet(channelTitle, description, publishedAt, title))

PT#S,
PT#M#S,
PT#H#M#S,
P#DT#H#M#S

»*/

let vid = args.shift();
if (!(vid && vid.match(/^[-_a-z0-9]{11}$/i))) return cberr("Bad video id!");
const parts=[//«
"snippet",
"contentDetails",
//"fileDetails",
//"player",
//"processingDetails",
//"recordingDetails",
"statistics",
//"status",
//"suggestions",
//"topicDetails"
]//»

//let url=`${base}/videos?id=${vid}&part=id%2C+snippet`
//let url=`${base}/videos?id=${vid}&part=id,snippet,statistics&fields=items(id,statistics,snippet(channelTitle,description,publishedAt,title))`
//let url=`${base}/videos?id=${vid}&part=id,snippet,statistics,contentDetails`;

let url=`${base}/videos?id=${vid}&part=id,snippet,statistics,contentDetails&fields=items(id,statistics(viewCount),contentDetails(duration),snippet(channelTitle,description,publishedAt,title, channelId))`
url+=`&key=${key}`;

let rv = await fetch(url);

if (!rv.ok){
	cberr(`Bad response: ${rv.status} (${rv.statusText})`);
	log(await rv.text());
	return;
}
let obj = await rv.json();
let itm = obj.items[0];
let snp = itm.snippet;
let durs = itm.contentDetails.duration;
let days=0,hrs=0,mins=0,secs=0;
let marr;
//PT#S,
//PT#M#S,
//PT#H#M#S,
//P#DT#H#M#S
if (marr = durs.match(/^PT(\d+)S$/)){
	secs = parseInt(marr[1]);
}
else if (marr = durs.match(/^PT(\d+)M(\d+)S$/)){
	mins = parseInt(marr[1]);
	secs = parseInt(marr[2]);
}
else if (marr = durs.match(/^PT(\d+)H(\d+)M(\d+)S$/)){
	hrs = parseInt(marr[1]);
	mins = parseInt(marr[2]);
	secs = parseInt(marr[3]);
}
else if (marr = durs.match(/^P(\d+)DT(\d+)H(\d+)M(\d+)S$/)){
	days = parseInt(marr[1]);
	hrs = parseInt(marr[2]);
	mins = parseInt(marr[3]);
	secs = parseInt(marr[4]);
}


let o={};
o.id = itm.id;
o.date = Math.round(new Date(snp.publishedAt).getTime()/1000);
o.title = snp.title;
o.desc = snp.description;
o.chanTitle = snp.channelTitle;
o.chanId = snp.channelId;
o.dur = secs+(mins*60)+(hrs*3600)+(days*86400);
o.views = itm.statistics.viewCount;

return JSON.stringify(o);

//jlog(obj);
//jlog(o);

//log(JSON.stringify(o,null, "  "));
//for (let item of o.items){
//	log(item.id.videoId);
//}
//cbok();


};//»
const com_ytdl=async(args,o)=>{//«

/*Object fields«

categories: ['Gaming']
channel: "Kurisu-pyon"
channel_follower_count: 1720
channel_id: "UC7AtGlWzcIfOXi64LdKfgxA"
description: "From South Park - S21E04 (No. 281) - The Franchise Prequel\nFrom Enter the Dragon (1973)"
duration: 46
epoch: 1662467589
title: "What's your shtyle/style/shtoyle?! (South Park/Enter the Dragon)"
upload_date: "20171012"
uploader: "Kurisu-pyon"
uploader_id: "LycisAhara"
uploader_url: "http://www.youtube.com/user/LycisAhara"
thumbnail: "https://i.ytimg.com/vi_webp/cnY5YK2ttaM/maxresdefault.webp"
tags: (2) ['enter the dragon', 'south park']
view_count: 409497

filesize: 761929
format: "251 - audio only (medium)"
format_id: "251"
format_note: "medium"


abr: 132.276
acodec: "opus"
age_limit: 0
asr: 48000
audio_channels: 2
audio_ext: "webm"
automatic_captions: {}
availability: "public"
average_rating: null
categories: ['Gaming']
channel: "Kurisu-pyon"
channel_follower_count: 1720
channel_id: "UC7AtGlWzcIfOXi64LdKfgxA"
channel_url: "https://www.youtube.com/channel/UC7AtGlWzcIfOXi64LdKfgxA"
chapters: null
comment_count: 246
container: "webm_dash"
description: "From South Park - S21E04 (No. 281) - The Franchise Prequel\nFrom Enter the Dragon (1973)"
display_id: "cnY5YK2ttaM"
downloader_options: {http_chunk_size: 10485760}
duration: 46
duration_string: "46"
dynamic_range: null
epoch: 1662467589
ext: "webm"
extractor: "youtube"
extractor_key: "Youtube"
filename: "/tmp/ytdl-ixzEvK/What_s_your_shtyle_style_shtoyle_South_Park_Enter_the_Dragon-251.webm"
filesize: 761929
format: "251 - audio only (medium)"
format_id: "251"
format_note: "medium"
formats: (23) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
fps: null
fulltitle: "What's your shtyle/style/shtoyle?! (South Park/Enter the Dragon)"
has_drm: false
height: null
http_headers: {User-Agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb…ML, like Gecko) Chrome/94.0.4606.41 Safari/537.36', Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,;q=0.8', Accept-Language: 'en-us,en;q=0.5', Sec-Fetch-Mode: 'navigate'}
id: "cnY5YK2ttaM"
is_live: false
language: ""
language_preference: -1
like_count: 4185
live_status: "not_live"
original_url: "cnY5YK2ttaM"
playable_in_embed: true
playlist: null
playlist_index: null
preference: null
protocol: "https"
quality: 3
release_timestamp: null
requested_subtitles: null
resolution: "audio only"
source_preference: -1
subtitles: {}
tags: (2) ['enter the dragon', 'south park']
tbr: 132.276
thumbnail: "https://i.ytimg.com/vi_webp/cnY5YK2ttaM/maxresdefault.webp"
thumbnails: (42) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
title: "What's your shtyle/style/shtoyle?! (South Park/Enter the Dragon)"
upload_date: "20171012"
uploader: "Kurisu-pyon"
uploader_id: "LycisAhara"
uploader_url: "http://www.youtube.com/user/LycisAhara"
url: "https://rr2---sn-5uaeznyy.googlevideo.com/videoplayback?expire=1662489190&ei=Bj4XY6noC6aj0_wP6Me10Aw&ip=2600%3A8807%3Ac2d7%3A8700%3A1c89%3Afd55%3A1f10%3Aac8&id=o-AOxlV4Si3ExbLDdAquNFOgpeX4BcIJgd6cj3ZvfU5z1T&itag=251&source=youtube&requiressl=yes&mh=Fr&mm=31%2C26&mn=sn-5uaeznyy%2Csn-p5qddn7k&ms=au%2Conr&mv=m&mvi=2&pl=35&initcwndbps=1532500&spc=lT-Khl3iJjY0mz0U-CDWAo7Tzh0iu54&vprv=1&svpuc=1&mime=audio%2Fwebm&gir=yes&clen=761929&dur=46.081&lmt=1507881540644933&mt=1662467101&fvip=3&keepalive=yes&fexp=24001373%2C24007246&c=ANDROID&rbqsm=fr&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Cgir%2Cclen%2Cdur%2Clmt&sig=AOq0QJ8wRQIhAMbvChOlkw0Wo-Qce0fiiRakii5hRqg5OcH0mhVSLP3oAiA8Ef607DgIp-iYB6asPNAXoxbyyPBB5GW96xR9Sn0Y5g%3D%3D&lsparams=mh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Cinitcwndbps&lsig=AG3C_xAwRgIhAKiX6x8PaQhP0Y1tUs2bc1LylwbtORMUKFs4pa7HbO9TAiEAmB07Y253lI3cNeA7qPrG6xwWAFOmKz-lfNkxaKbxNPM%3D"
urls: "https://rr2---sn-5uaeznyy.googlevideo.com/videoplayback?expire=1662489190&ei=Bj4XY6noC6aj0_wP6Me10Aw&ip=2600%3A8807%3Ac2d7%3A8700%3A1c89%3Afd55%3A1f10%3Aac8&id=o-AOxlV4Si3ExbLDdAquNFOgpeX4BcIJgd6cj3ZvfU5z1T&itag=251&source=youtube&requiressl=yes&mh=Fr&mm=31%2C26&mn=sn-5uaeznyy%2Csn-p5qddn7k&ms=au%2Conr&mv=m&mvi=2&pl=35&initcwndbps=1532500&spc=lT-Khl3iJjY0mz0U-CDWAo7Tzh0iu54&vprv=1&svpuc=1&mime=audio%2Fwebm&gir=yes&clen=761929&dur=46.081&lmt=1507881540644933&mt=1662467101&fvip=3&keepalive=yes&fexp=24001373%2C24007246&c=ANDROID&rbqsm=fr&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Cgir%2Cclen%2Cdur%2Clmt&sig=AOq0QJ8wRQIhAMbvChOlkw0Wo-Qce0fiiRakii5hRqg5OcH0mhVSLP3oAiA8Ef607DgIp-iYB6asPNAXoxbyyPBB5GW96xR9Sn0Y5g%3D%3D&lsparams=mh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Cinitcwndbps&lsig=AG3C_xAwRgIhAKiX6x8PaQhP0Y1tUs2bc1LylwbtORMUKFs4pa7HbO9TAiEAmB07Y253lI3cNeA7qPrG6xwWAFOmKz-lfNkxaKbxNPM%3D"
vcodec: "none"
video_ext: "none"
view_count: 409497
was_live: false
webpage_url: "https://www.youtube.com/watch?v=cnY5YK2ttaM"
webpage_url_basename: "watch"
webpage_url_domain: "youtube.com"
width: null
_filename: "/tmp/ytdl-ixzEvK/What_s_your_shtyle_style_shtoyle_South_Park_Enter_the_Dragon-251.webm"
_has_drm: null
_type: "video"


categories: ['Gaming']
channel: "Kurisu-pyon"
channel_follower_count: 1720
channel_id: "UC7AtGlWzcIfOXi64LdKfgxA"
description: "From South Park - S21E04 (No. 281) - The Franchise Prequel\nFrom Enter the Dragon (1973)"
duration: 46
epoch: 1662467589
title: "What's your shtyle/style/shtoyle?! (South Park/Enter the Dragon)"
upload_date: "20171012"
uploader: "Kurisu-pyon"
uploader_id: "LycisAhara"
uploader_url: "http://www.youtube.com/user/LycisAhara"
thumbnail: "https://i.ytimg.com/vi_webp/cnY5YK2ttaM/maxresdefault.webp"
tags: (2) ['enter the dragon', 'south park']
view_count: 409497

»*/
/*Notes«

Use the backend ytdl service to get audio files. It uses indexedDB (not the
new api) to save the mapping from the 11 character base64 id to the name
of the video file's name. If this is found in ~/Downloads with a ".part" at
the end, we need to continue the download, and instruct the server to create
an arbitrary file of n bytes to get the remainding chunks.

xTODOx Clean up everything in svcs/ytdl.js (remove the /tmp/yt-dl upon finishing the download...)


getch_loop???
Do a nice little getch_loop here, using the bottom 1 (or 2) line(s) for "app" status/instructions.

We can use

»*/
const cberr=(arg)=>{//«
	if (!arg) arg="Unknown error";
	err.push(arg);
	return {err}
};//»

let err = [];
let cbok;
let {term, opts} = o;
let {kill_register} = term;

//Var«

const YTDL_DB_NAME="ytdl";
const YTDL_DB_VERS=1;
const YTDL_STORE_NAME="videos";
const DOWNLOADS = "Downloads";
let db;
let vid;
let listid;
let index;
let chunks=[];
let fname;
let ws;
let killed = false;
let get_name="";
let home_path = `/home/${term.ENV.USER}`;
let path = `${home_path}/${DOWNLOADS}`;
let fullpath, partpath;
let partpath_node;
let tot_bytes_written=0;
let writing=false;
let got_error=false;
let resume_from = null;
let resume_name = null;
let partial="";
let is_done;
let tot_chunks=0;
let num_chunks_written=0;
//»

let rv = await fs.mkDir(home_path, DOWNLOADS);
//log("MKDIR",rv);
if (!rv) return cberr(`Could not make the directory: ${path}`);

//Funcs«

const open_db=()=>{//«
	return new Promise(async(y,n)=>{
		let req = indexedDB.open(YTDL_DB_NAME, YTDL_DB_VERS);
		req.onsuccess = function (evt) {
			db = this.result;
			y(true);
		};
		req.onerror = function (evt) {
cerr("openDb:", evt.target.errorCode);
			y();
		};
		req.onupgradeneeded = function (evt) {
log("openDb.onupgradeneeded");
			let store = evt.currentTarget.result.createObjectStore(YTDL_STORE_NAME,{keyPath: 'id'});
//			store.createIndex('type', 'type', { unique: false });
//			store.createIndex('by', 'by', { unique: false });
//			store.createIndex('time', 'time', { unique: false });
//			store.createIndex('score', 'score', { unique: false });
		};
	});
}//»
const get_object_store=(store_name, mode)=>{//«
//   * @param {string} store_name
//   * @param {string} mode either "readonly" or "readwrite"
	let tx = db.transaction(store_name, mode);
	return tx.objectStore(store_name);
}//»
const add_db_item=(obj)=>{//«
	return new Promise(async(y,n)=>{
		let store = get_object_store(YTDL_STORE_NAME, 'readwrite');
		let req;
		try {
		  req = store.put(obj);
		}
		catch (e) {
cerr(e);
			y();
			return;
		}
		req.onsuccess = function (evt) {
			y(true);
		};
		req.onerror = function() {
cerr("addPublication error", this.error);
			y();
		};
	});
}//»
const get_db_item=id=>{//«
	return new Promise(async(y,n)=>{
		let store = get_object_store(YTDL_STORE_NAME, 'readonly');
		if (!store) return y();
		let req = store.get(id);
		req.onsuccess=e=>{
			y(e.target.result);
		};
		req.onerror=e=>{
			cerr(e);
			y();
		};
	});
}//»
const rm_db_item=id=>{//«
	return new Promise(async(Y,N)=>{
		let store = get_object_store(YTDL_STORE_NAME, 'readwrite');
		if (!store) return Y();
		let req = store.delete(id);
		req.onsuccess = ()=> {Y(true);}
		req.onerror = (err)=> {
			Y();
cerr(err);
		}
	});
}//»

const doend=()=>{//«
	if (ws) ws.close();
//	termobj.getch_loop(null);
	cbok();
	killed = true;
};//»
const abort=()=>{//«
	if (ws&&!killed) {
		ws.send("Abort");
		setTimeout(doend, 250);
	}
	killed = true;
};//»
const trywrite=async()=>{//«
if (!partpath){
cwarn(`Waiting for partpath...`);
return;
}
		if (writing) {
			await sleep(25);
			return true;
		}
		let chunk = chunks.shift();
		if (!chunk) return;
		writing = true;
		partpath_node = await fs.writeFile(partpath, chunk, {append: true});
		if (!partpath_node){
cerr(`Could not write to ${partpath}`);
		}
		else {
//log("writeFile returned",partpath_node);
		}
		num_chunks_written++;
		tot_bytes_written+=chunk.size;
log(`num written = ${num_chunks_written} (${tot_bytes_written})`);
		writing = false;
		if (is_done) saveit();
		return true;
};//»
const finish_writing=async()=>{//«
	let iter=0;
	if (!chunks.length) return;
	chunks = [new Blob(chunks)];
cwarn("Finish writing...");
log(chunks);
	while (await trywrite()){
		iter++;
		if (iter > 1000000){
cerr("Infinite looper????");
			break;
		}
	}
//cwarn("Bytes written: ", tot_bytes_written);
};//»
const saveit=async()=>{//«
	if (!fullpath) return doend();
	await finish_writing();
//log(`Moving to: '${fullpath}'...`);
//	if (!await fs.mvFileByPath(partpath, fullpath)){
	if (!await fs.comMv([partpath, fullpath])){
log("Failed... here's the node");
log(partpath_node);
	}
//	await fs.writeFile(fullpath, new Blob(chunks));
if (!await(rm_db_item(vid))){
cerr(`Could not delete: ${vid}`);
}
	cbok();
	if (ws) {
		ws.send("Cleanup");
		setTimeout(()=>{
			ws.close();
		}, 250);
	}
//	termobj.getch_loop(null);
};//»
const init_file=()=>{//«
	return new Promise(async(Y,N)=>{
		fullpath = `${path}/${vid}_${fname}`;
		partpath = `${fullpath}.part`;
		if (get_name) {
log(fname);
			doend();
			Y();
			return;
		}
		if (await fs.pathToNode(fullpath)){
log(`The file already exists: ${fullpath}`);
			doend();
			Y();
			return;
		}
		if (!await add_db_item({id: vid, path: partpath})){
log("Could not add item  to the database");
			doend();
			Y();
			return;
		}

		partpath_node = await fs.pathToNode(partpath);
		if (!partpath_node) return Y(true);
		let f = await partpath_node._file;
		if (!f){//«
log(rv);
log("No node._file!?!?!?");
			doend();
			Y();
			return;
		}//»
		if (!Number.isFinite(f.size)){//«
log(`Want to resume download, but no 'size' in node!`);
			doend();
			Y();
			return;
		}//»
		tot_bytes_written = f.size;
log(`Resume download @${f.size}`);
		ws.send("Abort");
//		let fname = fullpath.split("/").pop();
		setTimeout(()=>{ws.send(`VID:${vid} ${fname} ${f.size}`);}, 250);
		Y(true);
	});
};//»
const initloop=()=>{//«

kill_register(cb=>{
log("GOT KILL");
	if (!killed) {
		if (ws) {
			ws.send("Abort");
			setTimeout(()=>{
				ws.close();
			}, 250);
		}
//		termobj.getch_loop(null);
		finish_writing();
	}
	cb&&cb();
	killed = true;
})
/*«
termobj.getch_loop(ch=>{
	if (termobj.h < minh) return;
}, n_scroll_lines, minh);
stat();
»*/

};//»
const startws=()=>{//«
return new Promise((Y,N)=>{

cbok = Y;
ws = new WebSocket(`ws://${window.location.hostname}:${port}/`);

ws.onopen=()=>{//«
//log(`VID${get_name}:${vid}`);

if (resume_name) ws.send(`VID${get_name}:${vid} ${resume_name} ${resume_from}`);
else ws.send(`VID${get_name}:${vid}`);

};//»
ws.onclose = ()=>{//«

//log('disconnected');
if (!killed) {
//cwarn("Closed");
Y({err: "Unexpectedly closing..."});
//	Y();
//	cberr();
//	termobj.getch_loop(null);
}

};//»
ws.onmessage = async e =>{//«

let obj;
let dat = e.data;
if (dat instanceof Blob) {//«
//cwarn("Chunk in");
//log(dat);
	tot_chunks++;
	chunks.push(dat);
log("IN", chunks.length, tot_chunks);
	trywrite();
	return 
}//»
else if (typeof dat !== 'string'){//«
	cerr("What the hell in onmessage???");
log(dat);
	return;
}//»

try{//«
	obj = JSON.parse(dat);
//log(obj);
}
catch(e){
cerr("What the hell no good JSON in onmessage???");
	log(dat);
	return;
}//»

if (obj.out){//«
	let s = obj.out.replace(/\n$/,"");
/*
	if (s.match(/^{"id":/)||partial){//«
		let o;
		try{//«
			partial=partial+s;
			o=JSON.parse(partial.replace(/\n/g,"\\n"));
		}
		catch(e){
//cwarn("Caught JSON parse error!");
//cerr(e);
//			let pos = parseInt(e.message.split(" ").pop());
//log(pos, s[pos], s[pos].charCodeAt());
			return;
		}//»
log("obj.out..");
log(o);
		partial = null;
		ws.send("FILEPATH:"+o.filename);
		fname = o.filename.split("/").pop();
		if (!await init_file()) return;
		let obj={};
		//uploader and channel can be the same (but not always?!?!?)
		let keys=[//«
		"categories",//[]
		"channel",
		"channel_follower_count",
		"channel_id",
		"description",
		"duration",
		"title",
		"upload_date",
		"uploader",
		"uploader_id",
		"thumbnail",
		"tags",//[]
		"view_count"
		];//»
		for (let k of keys)obj[k] = o[k];
log("INFO",obj);
		return;
	}//»
*/
	if (s.match(/^\[download\]/)) {
//		log((s.split("\n").pop()));
	}
	else err.push(s);
}//»
else if (obj.err) {//«

let s = obj.err;
if (s.match(/^WARNING: ffmpeg-location \/blah/)||s.match(/^WARNING: [-_0-9a-zA-Z]{11}: writing DASH/)){}
else {//«
/*Need to handle errors:«
ERROR: unable to download video data: <urlopen error [Errno -3] Temporary failure in name resolution>
Also, the "403 Forbidden" one...
»*/
let e = obj.err;
if (e.match(/ERROR:/)) {
	got_error = true;
cerr(e);
}
else cwarn(e);
err.push(e);

}//»

}//»
else if (obj.name) {//«
	if (obj.resume){
cwarn("Resuming...");
return;
	}
	fname = obj.name;
log(`Got fname: ${fname}`);
	if (!await init_file()) {
		cerr(`Could not initialize the file!`);
	}
}//»
else if (obj.done) {//«
	if (!partpath_node){
		is_done = true;
		return;
	}
	saveit();
}//»
else{//«
cwarn("WHAT IS THIS???");
log(obj);
}//»

};//»

});
}//»

//»

if (!await open_db()) return cberr("No database!");

//Startup«
let port = 20003;

//if (!opts) return;
if (opts.name||opts.n) get_name = "_NAME";
let portarg = opts.port||opts.p;
if (portarg){
	let portnum = portarg.pi({MIN:1024, MAX: 65535});
	if (!Number.isFinite(portnum)) return cberr("Invalid port");
	port = portnum;
}
let arg = args.shift();//«
if (!arg) {
	arg = DEF_YT_ID;
//cwarn(`Defaulting to DEF_YT_ID(${DEF_YT_ID})`);
}
if (arg.match(/youtube\.com/)){//«
	let url;
	try{
		url = new URL(arg);
	}
	catch(e){
		return cberr(e.message);
	}
	if (!url.hostname.match(/youtube\.com$/)) return cberr("Does not appear to be a youtube.com link!");
	let params = url.searchParams;
	vid = params.get("v");
	listid = params.get("list");
	index = params.get("index");
}
else if (arg.match(/^[-_a-zA-Z0-9]+$/)) {
	if (arg.length === 11) vid = arg;
	else if (arg.length >= 24 && arg.match(/^[A-Z][A-Z]/)) listid = arg;
	else return cberr("Bad looking ID");
}//»
//vid = arg;
//if (!vid)
if (listid){
	return cberr("TODO: implement lists");
}
if (!(vid && vid.match(/^[-_a-zA-Z0-9]{11}$/))) return cberr("Bad looking youtube id");
//»
rv = await get_db_item(vid);
if (rv){//«

//log(rv);
	partpath_node = await fs.pathToNode(rv.path);
log("PARTNODE",partpath_node);
	if (!partpath_node){//«
cwarn(`Could not find path ${rv.path}, deleting db item...`);
		await rm_db_item(vid);
	}//»
	else {//«
		partpath = rv.fullpath;
		fullpath = partpath.replace(/\.part$/,"");
		resume_name = node.name.replace(/\.part$/,"");
		let f = await node._file;
		if (!f) {
log(node);
			return cberr("No node._file!?!?!?");
		}
		resume_from = f.size;
		if (!Number.isFinite(resume_from)) {
log(f);
			return cberr("Invalid entry size!?!?!?");
		}
	}//»

}//»
initloop();
return await startws();

//»

};//»

export const coms={//«
	ytsrch: com_ytsrch,
	ytthing: com_ytthing,
	ytvid: com_ytvid,
	ytdl: com_ytdl
}//»


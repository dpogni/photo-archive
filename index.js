
const albumBucketName;
const cloudfrontBaseUrl;
const identityPoolId;
const awsRegion;


// Initialize the Amazon Cognito credentials provider
AWS.config.region = awsRegion; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId,
});

// Create a new service object
const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: {Bucket: albumBucketName}
});

// A utility function to create HTML.
function getHtml(template) {
    return template.join('\n');
}


// Show the photos that exist in an album.
function viewAlbum(albumName, startAfter = albumName+"/jpg/", prevTag = "") {
    var albumPhotosKey = albumName + '/';
    s3.listObjectsV2({Prefix: albumPhotosKey+"jpg/", StartAfter: startAfter, MaxKeys: 30}, function(err, data) {
        if (err) {
            return alert('There was an error viewing your album: ' + err.message);
        }
        // 'this' references the AWS.Response instance that represents the response
        var href = this.request.httpRequest.endpoint.href;
        var photoKey = "";
        var i = 0;
        var photos = data.Contents.map(function(photo) {
            photoKey = photo.Key;
            const imageRequest = JSON.stringify({
                bucket: albumBucketName,
                key: photoKey,
                edits: {
                    resize: {width: 380}
                }
            });
            i++;
            var photoUrl = cloudfrontBaseUrl + btoa(imageRequest);
            return getHtml(['<p><img src="'+photoUrl+'" class="img" />'+photoKey+'</p>']);

        });

        var message = photos.length ?
            '<p>The following photos are present.</p>' :
            '<p>There are no photos in this album.</p>';
        var htmlTemplate = [
            '<div>',
            '<button class="backtoalbums">',
            'Back To Albums',
            '</button>',
            '</div>',
            '<h2>',
            'Album: ' + albumName,
            '</h2>',
            message,
            '<div>',
            getHtml(photos),
            '</div>',
            '<h2>',
            'End of Album: ' + albumName,
            '</h2>',
            '<div>',
            '<button class="backtoalbums">',
            'Back To Albums',
            '</button>',
            '<button class="pagebutton" data-albumname="' + albumName + '" data-pagetag="'+ prevTag +'">prev set</button>',
            '<button class="pagebutton" data-albumname="' + albumName + '" data-pagetag="'+ photoKey +'"  data-prevtag="'+ data.Contents[0].Key +'">next set</button>',
            '</div>',
        ];
        document.getElementById('photos').innerHTML = getHtml(htmlTemplate);
        document.getElementsByTagName('img')[0].setAttribute('style', 'display:none;');

        // TODO: remove this terrible workaround for a click event to "view" the album
        const buttons = document.getElementsByClassName("backtoalbums");
        Array.from(buttons).forEach(function(element) {
            element.addEventListener('click', function(){
                listAlbums();
            });
        });

        const pagebuttons = document.getElementsByClassName("pagebutton");
        Array.from(pagebuttons).forEach(function(element) {
            element.addEventListener('click', function(){
                viewAlbum(event.target.dataset.albumname, event.target.dataset.pagetag, event.target.dataset.prevtag)
            });
        });
    });
}

// List the photo albums that exist in the bucket.
function listAlbums() {
    s3.listObjects({Delimiter: '/'}, function(err, data) {
        if (err) {
            return alert('There was an error listing your albums: ' + err.message);
        } else {
            var albums = data.CommonPrefixes.map(function(commonPrefix) {
                var prefix = commonPrefix.Prefix;
                var albumName = decodeURIComponent(prefix.replace('/', ''));
                return getHtml([
                    '<li>',
                    '<button class="album" style="margin:5px;" data-albumname="' + albumName + '">',
                    albumName,
                    '</button>',
                    '</li>'
                ]);

            });
            var message = albums.length ?
                getHtml([
                    '<p>Click on an album name to view it.</p>',
                ]) :
                '<p>You do not have any albums. Please Create album.';
            var htmlTemplate = [
                '<h2>Albums</h2>',
                message,
                '<ul>',
                getHtml(albums),
                '</ul>',
            ]
            document.getElementById('photos').innerHTML = getHtml(htmlTemplate);
        }

        // TODO: remove this terrible workaround for a click event to "view" the album
        const buttons = document.getElementsByClassName("album");
        Array.from(buttons).forEach(function(element) {
            element.addEventListener('click', function(){
                viewAlbum(event.target.dataset.albumname)
            });
        });
    });
}

listAlbums();





















// TODO: this works, but it needs to be called after the image has been rendered on the page. this will be tuff in the current implementation
// function getExif() {
//     console.log('getExif')
//     var images = document.getElementsByTagName("img");
//     Array.prototype.forEach.call(images, function(image) {
//         EXIF.getData(image, function() {
//             var allMetaData = EXIF.getAllTags(this);
//             var allMetaDataSpan = document.getElementById("allMetaDataSpan");
//             allMetaDataSpan.innerHTML = JSON.stringify(allMetaData, null, "\t");
//         });
//     });
//
// }



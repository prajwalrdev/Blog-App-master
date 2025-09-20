$(document).ready(function() {
	
	// Configuration - Resilient API resolution (same-origin first, fallbacks)
	var API_ROOT_CANDIDATES = [
		window.location.origin,
		'http://localhost:3000',
		'http://127.0.0.1:3000',
		'http://localhost:3001',
		'http://127.0.0.1:3001'
	];
	var API_ROOT = null;
	var API_URL = null; // will be `${API_ROOT}/api/blogposts`

	function resolveApiUrl(callback) {
		if (API_URL && API_ROOT) { return callback(API_URL); }
		var index = 0;
		function tryNext() {
			if (index >= API_ROOT_CANDIDATES.length) {
				return callback(null);
			}
			var root = API_ROOT_CANDIDATES[index++];
			var healthUrl = root + '/api/health';
			$.ajax({ url: healthUrl, method: 'GET', timeout: 3000 })
			.done(function() {
				API_ROOT = root;
				API_URL = API_ROOT + '/api/blogposts';
				callback(API_URL);
			})
			.fail(function() { tryNext(); });
		}
		tryNext();
	}

    // Function to fetch all blog posts
	function getAllPosts() {
		$('.overlay').css("display", "block");
		$('#blogPosts').html(''); // Clear existing content
		
		resolveApiUrl(function(resolvedUrl) {
			if (!resolvedUrl) {
				console.error('Failed to resolve API URL');
				showError('Failed to load blog posts. Please check your API configuration.');
				$('.overlay').css("display", "none");
				$('.container').css("display", "block");
				return;
			}

			$.ajax({
				url: resolvedUrl,
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				},
				success: function(response) {
					try {
						// Parse the JSON response
						var data;
						if (typeof response === 'string') {
							data = JSON.parse(response);
						} else {
							data = response;
						}
						
						// Handle the MongoDB API response format
						var posts = data.posts || data;
						if (typeof posts === 'string') {
							posts = JSON.parse(posts);
						}

						// Handle the response from the API
						var postsHTML = '';
						if (Array.isArray(posts) && posts.length > 0) {
							posts.forEach(function(post) {
								var readMoreButton = '';
								if (post.url) {
									readMoreButton = `<a href="${post.url}" class="btn btn-primary" target="_blank">Read More</a>`;
								}
								
								var createdAt = post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '';
								
								postsHTML += `
									<div class="card mb-3">
										<div class="card-body">
											<h5 class="card-title">${escapeHtml(post.title)}</h5>
											<p class="card-text">${escapeHtml(post.content)}</p>
											${readMoreButton}
											<button class="btn btn-danger delete-post" data-id="${post._id}">Delete</button>
											<small class="text-muted d-block mt-2">Created: ${createdAt}</small>
										</div>
									</div>
								`;
							});
						} else {
							postsHTML = '<div class="alert alert-info">No blog posts found. Create your first post!</div>';
						}
						
						$('#blogPosts').html(postsHTML);
					} catch (e) {
						console.error('Error parsing response:', e);
						showError('Error loading blog posts. Please check the console for details.');
					}
				},
				error: function(xhr, status, error) {
					console.error('Failed to fetch blog posts:', error);
					showError('Failed to load blog posts. Please check your API configuration.');
				},
				complete: function() {
					$('.overlay').css("display", "none");
					$('.container').css("display", "block");
				}
			});
		});
	}
	
	// Helper function to escape HTML
	function escapeHtml(text) {
		var map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};
		return text.replace(/[&<>"']/g, function(m) { return map[m]; });
	}
	
	// Helper function to show error messages
	function showError(message) {
		$('#blogPosts').html(`<div class="alert alert-danger">${message}</div>`);
		$('.toast-body').html(message);
		$('.toast').addClass('toast-fixed').toast('show');
	}


    // Get all posts when the page loads
    getAllPosts();

    // Event listener for the add post form
    $('#addPostForm').submit(function(event) {
        event.preventDefault();
        
        var title = $('#title').val().trim();
        var content = $('#content').val().trim();
        var url = $('#url').val().trim();
        
        // Validate input
        if (!title || !content) {
            showError('Please fill in both title and content fields.');
            return;
        }
        
        // Show loading state
        $('.overlay').css("display", "block");
        $('.container').css("display", "none");
		
		var settings = {
		  url: API_URL || (window.location.origin + '/api/blogposts'),
		  method: 'POST',
		  timeout: 10000,
		  headers: {
			"Content-Type": "application/json"
		  },
		  data: JSON.stringify({
			"title": title,
			"content": content,
			"url": url || undefined
		  }),
		};
		
		$.ajax(settings)
		.done(function (response) {
			try {
				var data;
				if (typeof response === 'string') {
					data = JSON.parse(response);
				} else {
					data = response;
				}
				
				var message = data.message || 'Post created successfully!';
				$('.toast-body').html(message);
				$('.toast').addClass('toast-fixed').toast('show');
				
				// Close the modal and clear form
				$('#addPostModal').modal('hide');
				$('#title').val('');
				$('#content').val('');
				$('#url').val('');
				
				// Refresh the posts list
				setTimeout(getAllPosts, 1000);
			} catch (e) {
				console.error('Error parsing response:', e);
				showError('Post created but there was an error processing the response.');
			}
		})
		.fail(function(xhr, status, error) {
			console.error('Failed to create post:', error);
			var errorMessage = 'Failed to create post. ';
			if (xhr.responseText) {
				try {
					var errorData = JSON.parse(xhr.responseText);
					errorMessage += errorData.message || error;
				} catch (e) {
					errorMessage += error;
				}
			} else {
				errorMessage += error;
			}
			showError(errorMessage);
		})
		.always(function() {
			$('.overlay').css("display", "none");
			$('.container').css("display", "block");
		});
    });

    // Event listener for deleting a post
    $(document).on('click', '.delete-post', function() {
        var postId = $(this).data('id');
        
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }
        
        // Show loading state
        $('.overlay').css("display", "block");
        $('.container').css("display", "none");
		
		var settings = {
		  url: (API_URL || (window.location.origin + '/api/blogposts')),
		  method: 'DELETE',
		  timeout: 10000,
		  headers: {
			"Content-Type": "application/json"
		  },
		  data: JSON.stringify({
			"postId": postId
		  }),
		};

        $.ajax(settings)
        .done(function (response) {
			try {
				var data;
				if (typeof response === 'string') {
					data = JSON.parse(response);
				} else {
					data = response;
				}
				
				var message = data.message || 'Post deleted successfully!';
				$('.toast-body').html(message);
				$('.toast').addClass('toast-fixed').toast('show');
				
				// Refresh the posts list
				setTimeout(getAllPosts, 1000);
			} catch (e) {
				console.error('Error parsing response:', e);
				showError('Post deleted but there was an error processing the response.');
			}
		})
		.fail(function(xhr, status, error) {
			console.error('Failed to delete post:', error);
			var errorMessage = 'Failed to delete post. ';
			if (xhr.responseText) {
				try {
					var errorData = JSON.parse(xhr.responseText);
					errorMessage += errorData.message || error;
				} catch (e) {
					errorMessage += error;
				}
			} else {
				errorMessage += error;
			}
			showError(errorMessage);
		})
		.always(function() {
			$('.overlay').css("display", "none");
			$('.container').css("display", "block");
		});
    });
});

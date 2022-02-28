@include('include.header')


	 <section class="section">
		 <div class="container">

<form method="POST" enctype="multipart/form-data" action="{{route('admin-update-course',['id' => $course->id])}}">

	 @method('PUT')
	@csrf
<div class="field">
  <label class="label">Name</label>
  <div class="control">

		<input class="input" type="text" name="name" value="{{$course->name}}">

	
  </div>
</div>


<div class="field">
  <label class="label">Description</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="description">{{$course->description}}</textarea>
	
  </div>
</div>

<div class="field">
  <div class="control">
    <label class="checkbox">
	

		@if ($course->published)
			<input type="checkbox" name="published" checked>
		@else
			<input type="checkbox" name="published">
		@endif

     Published
    </label>
  </div>
</div>


<div class="field">
  <div class="control">
  @if (isset($course->image))
<img src="{{$course->image}}">  
  @endif
  </div>
</div>


  <div class="field">
  <div class="control">
<div class="file has-name">
  <label class="file-label">
    <input class="file-input" type="file" name="image">
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label">
        Choose a file…
      </span>
    </span>
    <span class="file-name">
     
    </span>
  </label>
</div>
  </div>
</div>

<div class="field">
  <div class="control">
    <button class="button is-success is-large">Save</button>
  </div>
</div>
</form>


    </div>

    </section>

		 <section class="section">
		 <div class="container">
<article class="message is-danger">
  <div class="message-header">
    <p>Danger!</p>

  </div>
  <div class="message-body">
			<form method="POST" action="{{route('admin-delete-course',['id' => $course->id])}}">
			
			 @method('DELETE')
			@csrf
			
			<button class="button is-danger is-fullwidth">Delete course</button>
			 </form>
  </div>
</article>

    </div>

    </section>



@include('include.footer')
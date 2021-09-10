@include('include.header')


	
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">
		  <ul>
			<li ><a href="{{route('courses')}}">Courses</a></li>
		  </ul>
	</nav>
    </div>



	 <section class="section">
		 <div class="container">

<form method="POST" enctype="multipart/form-data" action="{{route('add-new-course')}}">
    @csrf
	
<div class="field">
  <label class="label">Name</label>
  <div class="control">

		<input class="input" type="text" placeholder="Course name" name="name" value="">

  </div>
</div>


<div class="field">
  <label class="label">Description</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="description"></textarea>
	
  </div>
</div>

<div class="field">
  <div class="control">
    <label class="checkbox">

		<input type="checkbox" name="published">

     Published
    </label>
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



@include('include.footer')
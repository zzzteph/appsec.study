@include('include.header')


	 <section class="section">

	 <div class="container">
	 
      <nav class="breadcrumb" aria-label="breadcrumbs">
         <ul>
            <li><a href="{{route('admin-view-lessons')}}">Lessons management</a></li>
			<li class="is-active"><a href="#" >New Theory </a></li>
         </ul>
      </nav>
	  <hr/>
</div>


		 <div class="container">
<h1 class="title">New Theory lesson</h1>




			<form method="POST" action="{{route('admin-add-new-theory-lesson')}}">
			@csrf

	
	<div class="field">
  <label class="label">Lesson name</label>
  <div class="control">
		<input class="input" type="text" placeholder="Lesson name" name="name" value="">
  </div>
</div>


<div class="field">
  <label class="label">Short description</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="description"></textarea>
	
  </div>
</div>

<hr/>
	
	

<div class="field">
  <label class="label">Content</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" id="content" name="content"></textarea>
	
  </div>
</div>


<div class="field">
  <label class="label">Score</label>
  <div class="control">
		<input class="input" type="text" placeholder="100" name="score" value="100">
  </div>
</div>


<div class="field">
  <div class="control">
    <label class="checkbox">

		<input type="checkbox" name="cancel">

     Can be canceled?
    </label>
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
    <button class="button is-success">Save</button>
  </div>
</div>
</form>


    </div>

    </section>



@include('include.footer')
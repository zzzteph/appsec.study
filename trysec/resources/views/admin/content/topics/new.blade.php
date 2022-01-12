@include('include.header')

  <script>
    tinymce.init({
      selector: '#description'
    });
  </script>
	 <section class="section">
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">

	</nav>




<form method="POST" action="{{route('admin-add-new-topic')}}">
  @csrf

	

<div class="field">
  <label class="label">Name</label>
  <div class="control">

		<input class="input" type="text" placeholder="Topic name" name="name" value="">
	
  </div>
</div>


<div class="field">
  <label class="label">Description</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" id="description" name="description"></textarea>
	
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
    <button class="button is-success is-large">Save</button>
  </div>
</div>
</form>


    </div>

    </section>

@include('include.footer')
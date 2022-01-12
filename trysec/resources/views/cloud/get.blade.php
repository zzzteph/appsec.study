@include('include.header')



	 <section class="section">
		 <div class="container">
		 


		 
		 
@if (isset($cloud->id))
	<form method="POST" enctype="multipart/form-data" action="{{route('update-cloud')}}">
    @csrf
	 @method('PUT')
	 <input type="hidden" name="id" value="{{$cloud->id}}">
	@else 
	 <form method="POST"  enctype="multipart/form-data" action="{{route('create-cloud')}}">
    @csrf
	 
	@endif
<h1 class="title">General cloud configuration</h1>
<div class="field">
  <label class="label">Name</label>
  <div class="control">
	@if (isset($cloud->name))
  
	
		<input class="input" type="text" name="name" value="{{$cloud->name}}">
	
	@else
		<input class="input" type="text" placeholder="cloud name" name="name" value="">
	@endif
	
  </div>
</div>
<hr/>
<h1 class="title">Cloud configuration</h1>

<div class="field">
  <label class="label">Project name</label>
  <div class="control">
	@if (isset($cloud->project))
  
	
		<input class="input" type="text" name="project" value="{{$cloud->project}}">
	
	@else
		<input class="input" type="text" placeholder="Project" name="project" value="">
	@endif
	
  </div>
</div>





  <div class="field">
  <div class="control">
<div class="file has-name">
  <label class="file-label">
 
    <input class="file-input" type="file" name="keyfile">
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label">
         JSON config file
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